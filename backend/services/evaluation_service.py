
import time
import os
import json
import requests
import base64
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env file
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env", override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


# Predefined answer patterns and their marks
ANSWER_PATTERNS = {
    "2": ("Short Answer", 2),
    "3": ("Brief Answer", 3),
    "5": ("Paragraph Answer", 5),
    "8": ("Structured Answer", 8),
    "10": ("Detailed Answer", 10),
    "15": ("Comprehensive Answer", 15)
}

def evaluate_handwritten_answer(image_bytes, mime_type, data):

    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is missing in .env")

    # Convert uploaded image into Base64
    encoded_image = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    prompt = """
You are LearnWise AI, an expert handwriting reader.

Read the handwritten examination answer in the uploaded image.

INSTRUCTIONS:

1. Extract the complete handwritten answer.
2. Preserve the original meaning and sentence order.
3. Do not correct grammar or spelling.
4. Do not add information that is not written.
5. If a word cannot be understood, write [unclear].
6. Ignore question numbers, page numbers and unrelated markings.
7. Return only the extracted answer text.
"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/{GEMINI_MODEL}:generateContent"
    )

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": encoded_image
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1
        }
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=120
    )

    response.raise_for_status()

    result = response.json()

    if "candidates" not in result or not result["candidates"]:
        raise ValueError("Unable to read the handwritten answer.")

    extracted_text = (
        result["candidates"][0]["content"]["parts"][0]["text"]
    ).strip()

    if not extracted_text:
        raise ValueError("No handwritten text was detected.")

    # Reuse the existing evaluation function
    evaluation_data = data.copy()
    evaluation_data["student_answer"] = extracted_text

    evaluation = evaluate_answer(evaluation_data)

    return {
        "extracted_answer": extracted_text,
        "evaluation": evaluation
    }


def evaluate_answer(data):

    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is missing in .env")

    subject = data.get("subject", "")
    topic = data.get("topic", "")
    question = data.get("question", "")
    student_answer = data.get("student_answer", "")

    answer_pattern = str(data.get("answer_pattern", "5")).lower()
    custom_pattern = data.get("custom_pattern", "").strip()

    # Determine maximum marks from the selected pattern
    if answer_pattern == "custom":

        if not custom_pattern:
            raise ValueError("Please enter your custom answer pattern.")

        pattern_name = "Custom Answer Pattern"
        max_marks = None

        marks_instruction = """
The student selected a custom answer pattern.

Determine suitable maximum marks between 1 and 15
based on the question complexity and requested structure.

You must return a whole-number maximum_marks value.
"""

    else:

        if answer_pattern not in ANSWER_PATTERNS:
            raise ValueError("Invalid answer pattern selected.")

        pattern_name, max_marks = ANSWER_PATTERNS[answer_pattern]

        marks_instruction = f"""
The selected pattern is {pattern_name}.

The maximum marks are FIXED at {max_marks}.

Do not change the maximum marks.
Evaluate the answer strictly within {max_marks} marks.
"""

    prompt = f"""
You are LearnWise AI, an intelligent educational answer evaluator.

Evaluate the student's answer fairly and provide useful
exam-oriented feedback.

STUDENT DETAILS

Subject: {subject}
Topic: {topic}
Question: {question}
Answer Pattern: {pattern_name}
Custom Answer Structure: {custom_pattern}
Student Answer: {student_answer}

MARK ALLOCATION

{marks_instruction}

EVALUATION CRITERIA

1. Correctness of concepts.
2. Relevance to the question.
3. Completeness of the answer.
4. Proper explanation and clarity.
5. Appropriate examples and keywords.
6. Expected structure and depth for the selected pattern.

IMPORTANT RULES

- Do not award full marks for incomplete answers.
- Do not penalize simple but technically correct language.
- Accept technically correct alternative explanations.
- Do not invent mistakes.
- Give constructive and understandable feedback.
- Follow the selected answer pattern when writing the correct answer.
- For custom patterns, follow the requested structure.
- marks_obtained must never exceed maximum_marks.
- maximum_marks must be between 1 and 15.
- Return marks_obtained as a number.
- Return maximum_marks as a whole number.

RETURN ONLY VALID JSON.

Use this structure:

{{
    "marks_obtained": 0,
    "maximum_marks": {max_marks if max_marks is not None else 0},
    "percentage": 0,
    "performance": "Needs Improvement",
    "strengths": ["point 1"],
    "mistakes": ["mistake 1"],
    "missing_points": ["missing point 1"],
    "correct_answer": "A complete exam-oriented answer",
    "improvement_tips": ["tip 1"],
    "next_topic": "Recommended topic"
}}

For a custom pattern, replace maximum_marks with
the suitable whole-number marks you determine.

Return valid JSON without Markdown formatting.
"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/{GEMINI_MODEL}:generateContent"
    )

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3
        }
    }

    # Gemini API request with retry
    response = None

    for attempt in range(4):

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=120
            )

            if response.status_code in [500, 502, 503, 504]:

                if attempt < 3:
                    wait_time = 2 ** (attempt + 1)

                    print(
                        f"Gemini temporarily unavailable. "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)
                    continue

            response.raise_for_status()
            break

        except (
            requests.exceptions.Timeout,
            requests.exceptions.ConnectionError
        ):

            if attempt < 3:
                wait_time = 2 ** (attempt + 1)

                print(
                    f"Gemini connection issue. "
                    f"Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)

            else:
                raise

    if response is None:
        raise Exception("Gemini API did not return a response.")

    response.raise_for_status()

    result = response.json()

    if "candidates" not in result or not result["candidates"]:
        raise ValueError(f"Gemini returned no answer: {result}")

    generated_text = (
        result["candidates"][0]["content"]["parts"][0]["text"]
    )

    evaluation = json.loads(generated_text)

    # Validate AI-generated marks
    obtained = float(evaluation["marks_obtained"])
    maximum = int(evaluation["maximum_marks"])

    if maximum < 1 or maximum > 15:
        raise ValueError("Invalid maximum marks returned by Gemini.")

    if obtained < 0 or obtained > maximum:
        raise ValueError("Invalid marks obtained returned by Gemini.")

    evaluation["percentage"] = round(
        (obtained / maximum) * 100, 2
    )

    return evaluation

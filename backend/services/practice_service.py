
import json
import re

from services.concept_service import call_gemini


def parse_questions_json(response_text):
    """Convert Gemini's JSON response into Python data."""

    cleaned = response_text.strip()

    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ValueError(
            "AI returned an invalid question format. Please try again."
        ) from error

    if not isinstance(data, dict):
        raise ValueError("Invalid question response from AI.")

    questions = data.get("questions")

    if not isinstance(questions, list) or not questions:
        raise ValueError("AI did not generate any questions.")

    return questions


def generate_practice_questions(
    subject,
    topic,
    source_text,
    learning_level,
    question_type,
    marks,
    difficulty,
    question_count
):
    """Generate MCQ or descriptive questions using Gemini."""

    if question_type == "mcq":
        question_instructions = """
Generate multiple-choice questions.

Every question must contain:
- question: the question text
- type: "mcq"
- options: exactly four answer options in an array
- correct_index: zero-based index of the correct option (0 to 3)
- explanation: a short explanation of the correct answer

Do not include the correct answer inside the question text.
Make the incorrect options plausible.
"""
    else:
        question_instructions = f"""
Generate university examination-style descriptive questions.

Each question must contain:
- question: the question text
- type: "descriptive"
- marks: {marks}
- model_answer: a well-structured answer suitable for {marks} marks
- key_points: an array of important points or keywords

Match the answer length and depth to the marks:
2 marks: definition or two important points.
3 marks: short explanation with key points.
5 marks: organised explanation with examples where relevant.
8 marks: detailed answer with headings and examples.
10 marks: comprehensive answer with clear structure.
15 marks: thorough university-style answer with headings,
examples, applications and a conclusion where appropriate.
"""

    prompt = f"""
You are LearnWise AI, an expert college examination tutor.

Generate practice questions using the supplied study material.

STUDENT DETAILS
Subject: {subject}
Topic: {topic or "Use the supplied syllabus"}
Learning level: {learning_level}
Question type: {question_type}
Difficulty: {difficulty}
Number of questions: {question_count}
Marks per question: {marks if question_type == "descriptive" else "Not applicable"}

QUESTION GENERATION RULES
1. Questions must be relevant to the subject and topic.
2. Use clear and grammatically correct language.
3. Match the selected difficulty level.
4. Avoid duplicate or repeated questions.
5. For manually entered topics, use accurate standard academic knowledge.
   For uploaded PDFs and saved learning paths, prioritise the supplied material.
6. Cover different important concepts where possible.
7. Return exactly {question_count} questions.

{question_instructions}

Return ONLY valid JSON in this structure:

{{
  "questions": [
    {{
      "question": "Question text",
      "type": "{question_type}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Explanation of the correct answer"
    }}
  ]
}}

For descriptive questions, use this structure for each item instead:

{{
  "question": "Question text",
  "type": "descriptive",
  "marks": {marks},
  "model_answer": "Complete model answer",
  "key_points": ["Important point 1", "Important point 2"]
}}

Do not add Markdown fences or text outside the JSON.
"""

    parts = [
        {"text": prompt},
        {
            "text": (
                "STUDY MATERIAL:\n"
                f"{source_text[:25000]}"
            )
        }
    ]

    response_text = call_gemini(parts)
    questions = parse_questions_json(response_text)

    if len(questions) != question_count:
        raise ValueError(
            "AI generated an unexpected number of questions. "
            "Please generate the practice set again."
        )

    for question in questions:
        if not isinstance(question, dict):
            raise ValueError("AI returned an invalid question.")

        if not isinstance(question.get("question"), str):
            raise ValueError("A generated question is missing its text.")

        if question_type == "mcq":
            options = question.get("options")
            correct_index = question.get("correct_index")

            if (
                not isinstance(options, list)
                or len(options) != 4
                or not all(isinstance(option, str) for option in options)
            ):
                raise ValueError("AI returned an invalid MCQ option set.")

            if (
                not isinstance(correct_index, int)
                or isinstance(correct_index, bool)
                or correct_index not in range(4)
            ):
                raise ValueError("AI returned an invalid correct answer.")

            if not isinstance(question.get("explanation"), str):
                raise ValueError("An MCQ explanation is missing.")

            question["type"] = "mcq"

        else:
            if not isinstance(question.get("model_answer"), str):
                raise ValueError("A model answer is missing.")

            if not isinstance(question.get("key_points"), list):
                question["key_points"] = []

            question["type"] = "descriptive"
            question["marks"] = marks

    return questions


import json
import re
from io import BytesIO
from datetime import date

from pypdf import PdfReader

from services.concept_service import call_gemini


def extract_syllabus_pdf(pdf_bytes):
    """Extract readable syllabus text from an uploaded PDF."""

    reader = PdfReader(BytesIO(pdf_bytes))

    if reader.is_encrypted:
        raise ValueError("The uploaded PDF is password-protected.")

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        if text.strip():
            pages.append(f"[Page {page_number}]\n{text}")

    if not pages:
        raise ValueError(
            "No selectable text was found in this PDF. "
            "Please upload a text-based syllabus PDF."
        )

    return "\n\n".join(pages)[:25000]


def parse_gemini_json(generated_text):
    """Convert Gemini's response into a Python dictionary."""

    cleaned = generated_text.strip()

    # Remove Markdown code fences if Gemini includes them.
    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start == -1 or end == -1:
            raise ValueError(
                "AI returned an invalid study plan. Please try again."
            )

        try:
            result = json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            raise ValueError(
                "AI returned an invalid study plan. Please try again."
            )

    if not isinstance(result, dict):
        raise ValueError("AI returned an invalid study plan.")

    if not isinstance(result.get("daily_plan"), list):
        raise ValueError(
            "AI could not create a valid daily study schedule."
        )

    return result


def generate_learning_path(
    subject,
    syllabus_text,
    learning_level,
    exam_date,
    daily_hours
):
    """Generate a personalised study roadmap using Gemini."""

    today = date.today()
    available_days = (exam_date - today).days

    if available_days <= 0:
        raise ValueError("Please select a future examination date.")

    
    prompt = f"""
    You are LearnWise AI, an expert personalised study planner.

    Create a SHORT, SIMPLE and PRACTICAL study roadmap for a college student.

    STUDENT DETAILS
    Subject: {subject}
    Learning Level: {learning_level}
    Today's Date: {today.isoformat()}
    Exam Date: {exam_date.isoformat()}
    Available Days: {available_days}
    Daily Study Hours: {daily_hours}

    SYLLABUS:
    {syllabus_text}

    INSTRUCTIONS:
    1. Divide the syllabus into a logical daily learning schedule.
    2. Cover all important syllabus topics where possible.
    3. Start with basic concepts before advanced topics.
    4. Include revision and mock test days.
    5. Reserve the last study day for final revision.
    6. Never schedule beyond the examination date.
    7. Do not exceed the available daily study hours.
    8. Use simple language suitable for the student's level.
    9. Avoid lengthy explanations and repeated information.
    10. Keep each day's content VERY SHORT.

    OUTPUT:
    Return ONLY valid JSON. No Markdown code fences.

    Use exactly this structure:

    {{
    "overview": "A short 2-line summary of the study plan.",
    "subject": "{subject}",
    "total_days": {available_days},
    "daily_hours": {daily_hours},
    "daily_plan": [
        {{
        "day": 1,
        "date": "YYYY-MM-DD",
        "topic": "Short topic title",
        "duration_hours": 4,
        "learning_objectives": [
            "Understand the main concept",
            "Learn important terms"
        ],
        "activities": [
            "Read and understand the topic"
        ],
        "practice_task": "One short practice task.",
        "revision_task": "Revise today's key points."
        }}
    ],
    "revision_strategy": [
        "Revise important definitions",
        "Practise previous exam questions"
    ],
    "study_tips": [
        "Study consistently",
        "Take short breaks",
        "Practise daily"
    ]
    }}

    STRICT LENGTH LIMITS:
    - Overview: maximum 2 sentences.
    - Topic: maximum 10 words.
    - Learning objectives: maximum 2 points.
    - Activities: maximum 2 points.
    - Each point: maximum 12 words.
    - Practice task: maximum 15 words.
    - Revision task: maximum 12 words.
    - Revision strategy: maximum 4 short points.
    - Study tips: maximum 4 short points.

    Generate one concise daily entry for each available study day.
    Return valid JSON only.
    """

    generated_text = call_gemini([
        {"text": prompt}
    ])

    return parse_gemini_json(generated_text)

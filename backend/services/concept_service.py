
import os
import re
import time
import json
import base64
import requests

from io import BytesIO
from pathlib import Path
from dotenv import load_dotenv
from pypdf import PdfReader


# Load the backend .env file
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env", override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


def extract_relevant_pdf_text(pdf_bytes, topic):
    """
    Extract text from a PDF and select passages
    that are relevant to the requested topic.
    """

    reader = PdfReader(BytesIO(pdf_bytes))

    if reader.is_encrypted:
        raise ValueError("The uploaded PDF is password-protected.")

    paragraphs = []

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""

        for paragraph in re.split(r"\n\s*\n", page_text):
            cleaned = re.sub(r"\s+", " ", paragraph).strip()

            if len(cleaned) > 30:
                paragraphs.append({
                    "page": page_number,
                    "text": cleaned
                })

    if not paragraphs:
        raise ValueError(
            "No selectable text was found in this PDF. "
            "It may be a scanned book. Please try a text-based PDF."
        )

    # Find paragraphs related to the requested topic
    topic_words = set(
        re.findall(r"[a-zA-Z0-9]+", topic.lower())
    )

    scored_paragraphs = []

    for paragraph in paragraphs:
        paragraph_words = set(
            re.findall(
                r"[a-zA-Z0-9]+",
                paragraph["text"].lower()
            )
        )

        score = len(topic_words.intersection(paragraph_words))

        if score > 0:
            scored_paragraphs.append((score, paragraph))

    # Use the most relevant passages first
    scored_paragraphs.sort(
        key=lambda item: item[0],
        reverse=True
    )

    if scored_paragraphs:
        selected = [
            item[1] for item in scored_paragraphs[:12]
        ]
    else:
        # If no topic words match, use the first few passages
        selected = paragraphs[:5]

    selected.sort(key=lambda item: item["page"])

    extracted_content = "\n\n".join(
        f"[Page {item['page']}]\n{item['text']}"
        for item in selected
    )

    # Limit the amount of PDF text sent to Gemini
    return extracted_content[:25000]


def call_gemini(parts):
    """
    Send text or image content to Gemini with retries.
    """

    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is missing in .env")

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
                "parts": parts
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 4096
        }
    }

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
                        "Gemini temporarily unavailable. "
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
                    "Gemini connection issue. "
                    f"Retrying in {wait_time} seconds..."
                )
                time.sleep(wait_time)
            else:
                raise

    if response is None:
        raise Exception("Gemini did not return a response.")

    response.raise_for_status()

    result = response.json()

    if not result.get("candidates"):
        raise ValueError(
            "Gemini could not generate an explanation for this content."
        )

    candidate = result["candidates"][0]
    content = candidate.get("content", {})
    response_parts = content.get("parts", [])

    generated_text = "\n".join(
        part.get("text", "")
        for part in response_parts
        if part.get("text")
    )

    if not generated_text.strip():
        raise ValueError("Gemini returned an empty explanation.")

    return generated_text.strip()


def generate_concept_explanation(
    subject,
    topic,
    learning_level,
    source_type,
    source_text=None,
    image_bytes=None,
    image_mime_type=None
):
    """
    Generate an explanation using a manual topic,
    extracted PDF text, or an uploaded image.
    """

    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is missing in .env")

    prompt = f"""
You are LearnWise AI, a personalised educational tutor.

Help a college student understand the requested concept.

STUDENT DETAILS

Subject: {subject}
Topic: {topic}
Learning Level: {learning_level}
Learning Source: {source_type}

INSTRUCTIONS

1. Explain the topic at the selected learning level.
2. Use simple and understandable language.
3. Explain important technical terms.
4. Include a relevant example.
5. Explain diagrams or processes when present.
6. Include important definitions and key points.
7. Include real-world applications where relevant.
8. Finish with short revision notes.
9. Organise the answer with clear headings.
10. Do not invent quotations or page references.
11. If the supplied material does not contain enough
    information, clearly mention that limitation.

For uploaded reference material, prioritise the supplied
content. You may add supporting explanations, but clearly
distinguish them from what the source says.

Use this output structure:

1. Introduction
2. Simple Explanation
3. Important Terms
4. Step-by-Step Explanation (where applicable)
5. Example
6. Real-World Applications
7. Important Points to Remember
8. Quick Revision Notes

Write an educational explanation suitable for a college student.
"""

    parts = [{"text": prompt}]

    if source_type == "book":
        if not source_text:
            raise ValueError(
                "No relevant text was extracted from the PDF."
            )

        parts.append({
            "text": (
                "REFERENCE BOOK CONTENT:\n"
                "Use this extracted content as the main source "
                "for explaining the requested topic.\n\n"
                f"{source_text}"
            )
        })

    elif source_type == "image":
        if not image_bytes or not image_mime_type:
            raise ValueError("Please upload a valid image.")

        encoded_image = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        parts.append({
            "text": (
                "Analyse the uploaded textbook screenshot, "
                "notes, or diagram. Read the visible text, "
                "identify the relevant concepts, and explain "
                "the visual content accurately."
            )
        })

        parts.append({
            "inline_data": {
                "mime_type": image_mime_type,
                "data": encoded_image
            }
        })

    return call_gemini(parts)


from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone

from services.evaluation_service import (    evaluate_answer,    evaluate_handwritten_answer)
from database import evaluations_collection
from auth_utils import auth_required
from services.concept_service import call_gemini
import json
import re


evaluation_bp = Blueprint("evaluation", __name__)



@evaluation_bp.route("/api/evaluate-answer", methods=["POST"])
@auth_required
def evaluate_student_answer():

    try:
        data = request.get_json(silent=True) or {}

        required_fields = [
            "subject",
            "question",
            "student_answer"
        ]

        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"{field} is required"
                }), 400

        answer_pattern = str(
            data.get("answer_pattern", "5")
        ).strip()

        custom_pattern = data.get("custom_pattern", "").strip()

        if answer_pattern == "custom" and not custom_pattern:
            return jsonify({
                "success": False,
                "error": "Please describe your custom answer pattern."
            }), 400

        # Generate AI evaluation
        result = evaluate_answer(data)

        student = g.current_user

        evaluation_record = {
            "user_id": student["_id"],
            "student_name": student["name"],
            "student_email": student["email"],
            "subject": data.get("subject"),
            "topic": data.get("topic"),
            "question": data.get("question"),
            "student_answer": data.get("student_answer"),
            "answer_pattern": answer_pattern,
            "custom_pattern": custom_pattern,
            "max_marks": result.get("maximum_marks"),
            "evaluation": result,
            "created_at": datetime.now(timezone.utc)
        }

        saved = evaluations_collection.insert_one(
            evaluation_record
        )

        return jsonify({
            "success": True,
            "message": "Answer evaluated and saved successfully.",
            "evaluation_id": str(saved.inserted_id),
            "evaluation": result
        }), 200

    except Exception as e:
        print("Evaluation Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to evaluate the answer. Please try again."
        }), 500

@evaluation_bp.route("/api/recommend-questions", methods=["POST"])
@auth_required
def recommend_questions():
    try:
        data = request.get_json(silent=True) or {}

        subject = data.get("subject", "").strip()
        topic = data.get("topic", "").strip()
        answer_pattern = str(data.get("answer_pattern", "5")).strip()
        custom_pattern = data.get("custom_pattern", "").strip()

        if answer_pattern not in ["2", "3", "5", "8", "10", "15", "custom"]:
            return jsonify({
                "success": False,
                "error": "Invalid answer pattern."
            }), 400

        if answer_pattern == "custom":

            if not custom_pattern:
                return jsonify({
                    "success": False,
                    "error": "Please describe your custom answer pattern."
                }), 400

            pattern_instruction = (
                f"Follow this custom answer structure: {custom_pattern}"
            )

        else:

            pattern_instruction = (
                f"Follow the selected {answer_pattern}-mark answer pattern."
            )

        if not subject or not topic:
            if not subject or not topic:
                return jsonify({"success": False,"error": "Please enter both subject and topic." }), 400

            if answer_pattern not in ["2", "3", "5", "8", "10", "15"]:
                 answer_pattern = "5"
                 if answer_pattern == "custom":
                    pattern_instruction = ( f"Follow this custom answer structure: {custom_pattern}")
                 else:
                    pattern_instruction = (f"Follow the selected {answer_pattern}-mark answer pattern.")     
        
        prompt = f"""
            You are LearnWise AI, an expert university examination tutor.

            Generate exactly 5 descriptive examination questions.

            Subject: {subject}
            Topic: {topic}
            Answer Pattern: {answer_pattern}

            ANSWER PATTERN INSTRUCTIONS:

            {pattern_instruction}
            {{
                "2": "Short Answer - definition and key points.",
                "3": "Brief Answer - short explanation with important details.",
                "5": "Paragraph Answer - organised explanation with an example.",
                "8": "Structured Answer - headings and detailed points.",
                "10": "Detailed Answer - in-depth explanation and applications.",
                "15": "Comprehensive Answer - complete explanation with headings, examples, applications and conclusion."
            }}

            Generate questions according to the selected answer pattern.

            RULES:
            1. Generate exactly 5 descriptive questions.
            2. All questions must relate to the given subject and topic.
            3. Match the complexity and depth to the selected marks.
            4. Avoid duplicate questions.
            5. Use clear university examination language.
            6. Do not generate MCQs.

            Return ONLY valid JSON:

            {{
                "questions": [
                    "Question 1",
                    "Question 2",
                    "Question 3",
                    "Question 4",
                    "Question 5"
                ]
            }}
            """

        response_text = call_gemini([
            {"text": prompt}
        ])

        cleaned = response_text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        result = json.loads(cleaned)
        questions = result.get("questions", [])

        if not isinstance(questions, list) or len(questions) != 5:
            raise ValueError("AI did not generate exactly 5 questions.")

        if not all(isinstance(q, str) and q.strip() for q in questions):
            raise ValueError("AI returned an invalid question.")

        return jsonify({
            "success": True,
            "questions": questions
        }), 200

    except Exception as error:
        print("Question Recommendation Error:", str(error))

        return jsonify({
            "success": False,
            "error": "Unable to recommend questions. Please try again."
        }), 500


@evaluation_bp.route("/api/evaluate-handwritten", methods=["POST"])
@auth_required
def evaluate_handwritten_student_answer():

    try:
        # Get uploaded image
        image = request.files.get("answer_image")

        if not image:
            return jsonify({
                "success": False,
                "error": "Please upload your handwritten answer image."
            }), 400

        # Validate image format
        allowed_types = {
            "image/jpeg",
            "image/png"
        }

        if image.mimetype not in allowed_types:
            return jsonify({
                "success": False,
                "error": "Only JPG, JPEG and PNG images are supported."
            }), 400

        # Read image bytes
        image_bytes = image.read()

        if not image_bytes:
            return jsonify({
                "success": False,
                "error": "The uploaded image is empty."
            }), 400

        # Get examination details
        subject = request.form.get("subject", "").strip()
        topic = request.form.get("topic", "").strip()
        question = request.form.get("question", "").strip()
        answer_pattern = request.form.get(
            "answer_pattern", "5"
        ).strip()
        custom_pattern = request.form.get(
            "custom_pattern", ""
        ).strip()

        if not subject or not question:
            return jsonify({
                "success": False,
                "error": "Subject and examination question are required."
            }), 400

        if answer_pattern == "custom" and not custom_pattern:
            return jsonify({
                "success": False,
                "error": "Please describe your custom answer pattern."
            }), 400

        evaluation_data = {
            "subject": subject,
            "topic": topic,
            "question": question,
            "answer_pattern": answer_pattern,
            "custom_pattern": custom_pattern
        }

        # Read handwriting and evaluate answer
        result = evaluate_handwritten_answer(
            image_bytes,
            image.mimetype,
            evaluation_data
        )

        student = g.current_user

        # Save evaluation
        evaluation_record = {
            "user_id": student["_id"],
            "student_name": student["name"],
            "student_email": student["email"],
            "subject": subject,
            "topic": topic,
            "question": question,
            "student_answer": result["extracted_answer"],
            "answer_pattern": answer_pattern,
            "custom_pattern": custom_pattern,
            "max_marks": result["evaluation"]["maximum_marks"],
            "evaluation": result["evaluation"],
            "answer_type": "handwritten",
            "created_at": datetime.now(timezone.utc)
        }

        saved = evaluations_collection.insert_one(
            evaluation_record
        )

        return jsonify({
            "success": True,
            "message": "Handwritten answer evaluated successfully.",
            "evaluation_id": str(saved.inserted_id),
            "extracted_answer": result["extracted_answer"],
            "evaluation": result["evaluation"]
        }), 200

    except Exception as e:
        print("Handwritten Evaluation Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to evaluate the handwritten answer. Please try again."
        }), 500

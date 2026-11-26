
from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from bson import ObjectId

from auth_utils import auth_required
from database import (
    learning_paths_collection,
    practice_sessions_collection
)

from services.concept_service import extract_relevant_pdf_text
from services.practice_service import generate_practice_questions


practice_bp = Blueprint("practice", __name__)


@practice_bp.route(
    "/api/generate-practice-questions",
    methods=["POST"]
)
@auth_required
def create_practice_questions():

    try:
        source_type = request.form.get("source_type", "").strip()
        subject = request.form.get("subject", "").strip()
        topic = request.form.get("topic", "").strip()

        learning_level = request.form.get(
            "learning_level", "Beginner"
        ).strip()

        question_type = request.form.get(
            "question_type", "mcq"
        ).strip()

        difficulty = request.form.get(
            "difficulty", "Medium"
        ).strip()

        question_count_text = request.form.get(
            "question_count", "5"
        ).strip()

        marks_text = request.form.get("marks", "5").strip()

        if source_type not in ["manual", "pdf", "learning_path"]:
            return jsonify({
                "success": False,
                "error": "Invalid learning source."
            }), 400

        if question_type not in ["mcq", "descriptive"]:
            return jsonify({
                "success": False,
                "error": "Invalid question type."
            }), 400

        if learning_level not in ["Beginner", "Intermediate", "Advanced"]:
            return jsonify({
                "success": False,
                "error": "Invalid learning level."
            }), 400

        if difficulty not in ["Easy", "Medium", "Hard"]:
            return jsonify({
                "success": False,
                "error": "Invalid difficulty level."
            }), 400

        try:
            question_count = int(question_count_text)
        except ValueError:
            return jsonify({
                "success": False,
                "error": "Invalid question count."
            }), 400

        if question_count not in [5, 10, 15]:
            return jsonify({
                "success": False,
                "error": "Choose 5, 10 or 15 questions."
            }), 400

        marks = None

        if question_type == "descriptive":
            try:
                marks = int(marks_text)
            except ValueError:
                return jsonify({
                    "success": False,
                    "error": "Invalid marks category."
                }), 400

            if marks not in [2, 3, 5, 8, 10, 15]:
                return jsonify({
                    "success": False,
                    "error": "Choose a valid marks category."
                }), 400

        source_text = ""

        # Manual topic source
        if source_type == "manual":

            if not subject or not topic:
                return jsonify({
                    "success": False,
                    "error": "Enter your subject and topic."
                }), 400

            source_text = (
                f"Subject: {subject}\n"
                f"Topic: {topic}\n"
                "Generate educational questions based on this topic."
            )

        # Uploaded syllabus PDF
        elif source_type == "pdf":

            if not subject:
                return jsonify({
                    "success": False,
                    "error": "Please enter the subject."
                }), 400

            uploaded_file = request.files.get("file")

            if not uploaded_file or not uploaded_file.filename:
                return jsonify({
                    "success": False,
                    "error": "Please upload a syllabus PDF."
                }), 400

            if not uploaded_file.filename.lower().endswith(".pdf"):
                return jsonify({
                    "success": False,
                    "error": "Only PDF files are supported."
                }), 400

            pdf_bytes = uploaded_file.read()

            if not pdf_bytes:
                return jsonify({
                    "success": False,
                    "error": "The uploaded PDF is empty."
                }), 400

            source_text = extract_relevant_pdf_text(
                pdf_bytes,
                topic or subject
            )

        # Saved learning path source
        elif source_type == "learning_path":

            path_id = request.form.get("path_id", "").strip()

            if not ObjectId.is_valid(path_id):
                return jsonify({
                    "success": False,
                    "error": "Please select a valid learning path."
                }), 400

            saved_path = learning_paths_collection.find_one({
                "_id": ObjectId(path_id),
                "student_id": g.current_user["_id"]
            })

            if not saved_path:
                return jsonify({
                    "success": False,
                    "error": "Learning path not found."
                }), 404

            learning_path = saved_path.get("learning_path", {})
            subject = saved_path.get("subject", subject)

            if not topic:
                return jsonify({
                    "success": False,
                    "error": "Enter the topic you want to practise."
                }), 400

            daily_plan = learning_path.get("daily_plan", [])

            source_text = "\n".join(
                str(day)
                for day in daily_plan
            )

            source_text = (
                f"Subject: {subject}\n"
                f"Selected topic: {topic}\n"
                f"Learning plan content:\n{source_text}"
            )

        questions = generate_practice_questions(
            subject=subject,
            topic=topic,
            source_text=source_text,
            learning_level=learning_level,
            question_type=question_type,
            marks=marks,
            difficulty=difficulty,
            question_count=question_count
        )

        return jsonify({
            "success": True,
            "message": "Practice questions generated successfully.",
            "questions": questions
        }), 200

    except ValueError as error:
        print("Practice Validation Error:", str(error))

        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        print("Practice Generation Error:", str(error))

        return jsonify({
            "success": False,
            "error": "Unable to generate practice questions. Please try again."
        }), 500


@practice_bp.route(
    "/api/save-practice-session",
    methods=["POST"]
)
@auth_required
def save_practice_session():

    try:
        data = request.get_json() or {}

        questions = data.get("questions")
        answers = data.get("answers")

        if not isinstance(questions, list) or not questions:
            return jsonify({
                "success": False,
                "error": "No practice questions were submitted."
            }), 400

        if not isinstance(answers, dict):
            return jsonify({
                "success": False,
                "error": "Invalid practice answers."
            }), 400

        if len(questions) > 15:
            return jsonify({
                "success": False,
                "error": "Too many questions in this session."
            }), 400

        question_type = data.get("question_type")

        if question_type not in ["mcq", "descriptive"]:
            return jsonify({
                "success": False,
                "error": "Invalid question type."
            }), 400

        score = data.get("score") or {}

        record = {
            "student_id": g.current_user["_id"],
            "subject": str(data.get("subject", ""))[:150],
            "topic": str(data.get("topic", ""))[:300],
            "question_type": question_type,
            "marks": data.get("marks"),
            "difficulty": str(data.get("difficulty", ""))[:30],
            "questions": questions,
            "answers": answers,
            "score": {
                "total": score.get("total", 0),
                "correct": score.get("correct", 0),
                "percentage": score.get("percentage", 0)
            },
            "created_at": datetime.now(timezone.utc)
        }

        result = practice_sessions_collection.insert_one(record)

        return jsonify({
            "success": True,
            "message": "Practice session saved successfully.",
            "session_id": str(result.inserted_id)
        }), 201

    except Exception as error:
        print("Save Practice Session Error:", str(error))

        return jsonify({
            "success": False,
            "error": "Unable to save practice session."
        }), 500


@practice_bp.route(
    "/api/my-practice-history",
    methods=["GET"]
)
@auth_required
def get_my_practice_history():

    try:
        sessions = practice_sessions_collection.find({
            "student_id": g.current_user["_id"]
        }).sort("created_at", -1).limit(50)

        history = []

        for item in sessions:
            history.append({
                "id": str(item["_id"]),
                "subject": item.get("subject", ""),
                "topic": item.get("topic", ""),
                "question_type": item.get("question_type", ""),
                "marks": item.get("marks"),
                "difficulty": item.get("difficulty", ""),
                "score": item.get("score", {}),
                "created_at": (
                    item["created_at"].isoformat()
                    if item.get("created_at") else None
                )
            })

        return jsonify({
            "success": True,
            "history": history
        }), 200

    except Exception as error:
        print("Practice History Error:", str(error))

        return jsonify({
            "success": False,
            "error": "Unable to retrieve practice history."
        }), 500


from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone

from services.concept_service import (
    extract_relevant_pdf_text,
    generate_concept_explanation
)

from database import concepts_collection
from auth_utils import auth_required


concept_bp = Blueprint("concept", __name__)


@concept_bp.route("/api/explain-concept", methods=["POST"])
@auth_required
def explain_concept():

    try:
        source_type = request.form.get("source_type", "").strip()
        subject = request.form.get("subject", "").strip()
        topic = request.form.get("topic", "").strip()

        learning_level = request.form.get(
            "learning_level", "Beginner"
        ).strip()

        # Validate required fields
        if not subject:
            return jsonify({
                "success": False,
                "error": "Subject is required."
            }), 400

        if not topic:
            return jsonify({
                "success": False,
                "error": "Topic is required."
            }), 400

        if source_type not in ["manual", "book", "image"]:
            return jsonify({
                "success": False,
                "error": "Invalid learning source."
            }), 400

        if learning_level not in [
            "Beginner",
            "Intermediate",
            "Advanced"
        ]:
            return jsonify({
                "success": False,
                "error": "Invalid learning level."
            }), 400

        source_text = None
        image_bytes = None
        image_mime_type = None

        uploaded_file = request.files.get("file")

        # Reference book PDF
        if source_type == "book":

            if not uploaded_file or not uploaded_file.filename:
                return jsonify({
                    "success": False,
                    "error": "Please upload a reference book PDF."
                }), 400

            if not uploaded_file.filename.lower().endswith(".pdf"):
                return jsonify({
                    "success": False,
                    "error": "Only PDF reference books are supported."
                }), 400

            pdf_bytes = uploaded_file.read()

            if not pdf_bytes:
                return jsonify({
                    "success": False,
                    "error": "The uploaded PDF is empty."
                }), 400

            source_text = extract_relevant_pdf_text(
                pdf_bytes,
                topic
            )

        # Screenshot or image
        elif source_type == "image":

            if not uploaded_file or not uploaded_file.filename:
                return jsonify({
                    "success": False,
                    "error": "Please upload a screenshot or image."
                }), 400

            allowed_types = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ]

            image_mime_type = uploaded_file.mimetype

            if image_mime_type not in allowed_types:
                return jsonify({
                    "success": False,
                    "error": "Only JPG, PNG and WEBP images are supported."
                }), 400

            image_bytes = uploaded_file.read()

            if not image_bytes:
                return jsonify({
                    "success": False,
                    "error": "The uploaded image is empty."
                }), 400

        # Generate AI explanation
        explanation = generate_concept_explanation(
            subject=subject,
            topic=topic,
            learning_level=learning_level,
            source_type=source_type,
            source_text=source_text,
            image_bytes=image_bytes,
            image_mime_type=image_mime_type
        )

        # Get logged-in student
        student = g.current_user

        # Prepare MongoDB document
        concept_record = {
            "user_id": student["_id"],
            "student_name": student["name"],
            "student_email": student["email"],
            "subject": subject,
            "topic": topic,
            "learning_level": learning_level,
            "source_type": source_type,
            "explanation": explanation,
            "created_at": datetime.now(timezone.utc)
        }

        # Save document in MongoDB
        saved = concepts_collection.insert_one(concept_record)

        # Return successful response
        return jsonify({
            "success": True,
            "message": "Concept explanation generated successfully.",
            "concept_id": str(saved.inserted_id),
            "explanation": explanation
        }), 200

    except ValueError as e:
        print("Concept Validation Error:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:
        print("Concept Explanation Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to generate the explanation. Please try again."
        }), 500
@concept_bp.route("/api/my-concepts", methods=["GET"])
@auth_required
def get_my_concepts():

    try:
        student = g.current_user

        # Retrieve only the logged-in student's concepts
        concepts = list(
            concepts_collection.find(
                {"user_id": student["_id"]}
            ).sort("created_at", -1)
        )

        concept_list = []

        for concept in concepts:
            concept_list.append({
                "id": str(concept["_id"]),
                "subject": concept.get("subject", ""),
                "topic": concept.get("topic", ""),
                "learning_level": concept.get("learning_level", ""),
                "source_type": concept.get("source_type", ""),
                "explanation": concept.get("explanation", ""),
                "created_at": (
                    concept["created_at"].isoformat()
                    if concept.get("created_at")
                    else None
                )
            })

        return jsonify({
            "success": True,
            "concepts": concept_list
        }), 200

    except Exception as e:
        print("Get Concepts Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to load your saved concepts."
        }), 500
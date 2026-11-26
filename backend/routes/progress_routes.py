
from flask import Blueprint, request, jsonify, g

from services.learning_path import generate_learning_path
from auth_utils import auth_required

from database import (
    evaluations_collection,
    concepts_collection,
    learning_paths_collection,
    practice_sessions_collection
)

progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/learning-path", methods=["POST"])
def learning_path():

    data = request.get_json()

    topic_scores = data.get("topic_scores", {})

    if not topic_scores:
        return jsonify({
            "error": "Topic scores are required"
        }), 400

    result = generate_learning_path(topic_scores)

    return jsonify({
        "success": True,
        "learning_path": result
    }), 200


@progress_bp.route("/api/student/overview", methods=["GET"])
@auth_required
def get_student_overview():

    student_id = g.current_user["_id"]
    student_id_str = str(student_id)

    # Match both ObjectId and string ID formats
    student_ids = [student_id, student_id_str]

    stats = {
        "total_evaluations": evaluations_collection.count_documents({
            "user_id": {"$in": student_ids}
        }),

        "total_concepts": concepts_collection.count_documents({
            "user_id": {"$in": student_ids}
        }),

        "total_learning_paths": learning_paths_collection.count_documents({
            "student_id": {"$in": student_ids}
        }),

        "total_practice_sessions": practice_sessions_collection.count_documents({
            "student_id": {"$in": student_ids}
        })
    }

    return jsonify({
        "success": True,
        "stats": stats
    }), 200

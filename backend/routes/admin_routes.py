
from datetime import datetime, timezone
from functools import wraps

from bson import ObjectId
from flask import Blueprint, jsonify, request, g

from auth_utils import auth_required
from database import (
    users_collection,
    evaluations_collection,
    concepts_collection,
    learning_paths_collection,
    practice_sessions_collection
)


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# -----------------------------------------
# ADMIN ACCESS PROTECTION
# -----------------------------------------

def admin_required(function):
    @wraps(function)
    @auth_required
    def wrapper(*args, **kwargs):
        if g.current_user.get("role") != "admin":
            return jsonify({
                "success": False,
                "error": "Admin access required."
            }), 403

        return function(*args, **kwargs)

    return wrapper


# -----------------------------------------
# HELPER FUNCTIONS
# -----------------------------------------

def serialize_date(value):
    if isinstance(value, datetime):
        return value.isoformat()

    return value


def serialize_student(student):
    return {
        "id": str(student["_id"]),
        "name": student.get("name", ""),
        "email": student.get("email", ""),
        "course": student.get("course", ""),
        "college": student.get("college", ""),
        "department": student.get("department", ""),
        "year_of_study": student.get("year_of_study", ""),
        "avatar": student.get("avatar"),
        "created_at": serialize_date(
            student.get("created_at")
        )
    }


def student_activity_counts(student_id):
    return {
        "evaluations": evaluations_collection.count_documents({
            "user_id": student_id
        }),
        "concepts": concepts_collection.count_documents({
            "user_id": student_id
        }),
        "learning_paths": learning_paths_collection.count_documents({
            "student_id": student_id
        }),
        "practice_sessions": practice_sessions_collection.count_documents({
            "student_id": student_id
        })
    }


# -----------------------------------------
# 1. ADMIN DASHBOARD OVERVIEW
# -----------------------------------------

@admin_bp.route("/overview", methods=["GET"])
@admin_required
def admin_overview():

    total_students = users_collection.count_documents({
        "role": {"$ne": "admin"}
    })

    total_evaluations = evaluations_collection.count_documents({})
    total_concepts = concepts_collection.count_documents({})
    total_learning_paths = learning_paths_collection.count_documents({})
    total_practice_sessions = practice_sessions_collection.count_documents({})

    return jsonify({
        "success": True,
        "overview": {
            "total_students": total_students,
            "total_evaluations": total_evaluations,
            "total_concepts": total_concepts,
            "total_learning_paths": total_learning_paths,
            "total_practice_sessions": total_practice_sessions
        }
    }), 200


# -----------------------------------------
# 2. GET ALL STUDENTS
# -----------------------------------------

@admin_bp.route("/students", methods=["GET"])
@admin_required
def get_all_students():

    page = max(request.args.get("page", 1, type=int), 1)
    limit = min(
        max(request.args.get("limit", 10, type=int), 1),
        100
    )

    query = {"role": {"$ne": "admin"}}

    total = users_collection.count_documents(query)

    students = list(
        users_collection.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )

    student_list = []

    for student in students:
        student_id = student["_id"]

        student_data = serialize_student(student)
        student_data["activity"] = student_activity_counts(
            student_id
        )

        student_list.append(student_data)

    return jsonify({
        "success": True,
        "students": student_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    }), 200


# -----------------------------------------
# 3. GET INDIVIDUAL STUDENT DETAILS
# -----------------------------------------

@admin_bp.route(
    "/students/<student_id>",
    methods=["GET"]
)
@admin_required
def get_student_details(student_id):

    if not ObjectId.is_valid(student_id):
        return jsonify({
            "success": False,
            "error": "Invalid student ID."
        }), 400

    student_object_id = ObjectId(student_id)

    student = users_collection.find_one({
        "_id": student_object_id,
        "role": {"$ne": "admin"}
    })

    if not student:
        return jsonify({
            "success": False,
            "error": "Student not found."
        }), 404

    evaluations = list(
        evaluations_collection.find({
            "user_id": student_object_id
        }).sort("created_at", -1).limit(20)
    )

    concepts = list(
        concepts_collection.find({
            "user_id": student_object_id
        }).sort("created_at", -1).limit(20)
    )

    learning_paths = list(
        learning_paths_collection.find({
            "student_id": student_object_id
        }).sort("created_at", -1).limit(20)
    )

    practice_sessions = list(
        practice_sessions_collection.find({
            "student_id": student_object_id
        }).sort("created_at", -1).limit(20)
    )

    evaluation_history = []

    for item in evaluations:
        result = item.get("evaluation", {})

        evaluation_history.append({
            "id": str(item["_id"]),
            "subject": item.get("subject", ""),
            "topic": item.get("topic", ""),
            "question": item.get("question", ""),
            "marks_obtained": result.get("marks_obtained"),
            "maximum_marks": result.get("maximum_marks"),
            "percentage": result.get("percentage"),
            "performance": result.get("performance", ""),
            "created_at": serialize_date(
                item.get("created_at")
            )
        })

    concept_history = [
        {
            "id": str(item["_id"]),
            "subject": item.get("subject", ""),
            "topic": item.get("topic", ""),
            "learning_level": item.get("learning_level", ""),
            "source_type": item.get("source_type", ""),
            "created_at": serialize_date(
                item.get("created_at")
            )
        }
        for item in concepts
    ]

    path_history = [
        {
            "id": str(item["_id"]),
            "subject": item.get("subject", ""),
            "completed_days": len(
                item.get("completed_days", [])
            ),
            "total_days": len(
                item.get("learning_path", {}).get(
                    "daily_plan", []
                )
            ),
            "created_at": serialize_date(
                item.get("created_at")
            )
        }
        for item in learning_paths
    ]

    practice_history = [
        {
            "id": str(item["_id"]),
            "subject": item.get("subject", ""),
            "topic": item.get("topic", ""),
            "score": item.get("score", {}),
            "created_at": serialize_date(
                item.get("created_at")
            )
        }
        for item in practice_sessions
    ]

    return jsonify({
        "success": True,
        "student": serialize_student(student),
        "activity": student_activity_counts(
            student_object_id
        ),
        "evaluation_history": evaluation_history,
        "concept_history": concept_history,
        "learning_path_history": path_history,
        "practice_history": practice_history
    }), 200

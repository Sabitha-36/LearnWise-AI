
from flask import Blueprint, request, jsonify, g
from datetime import datetime, date, timezone
from bson import ObjectId

from auth_utils import auth_required

from database import learning_paths_collection

from services.learning_path_service import (
    extract_syllabus_pdf,
    generate_learning_path
)


learning_path_bp = Blueprint("learning_path", __name__)


@learning_path_bp.route(
    "/api/generate-learning-path",
    methods=["POST"]
)
@auth_required
def create_learning_path():

    try:
        subject = request.form.get("subject", "").strip()

        topics = request.form.get("topics", "").strip()

        learning_level = request.form.get(
            "learning_level", "Beginner"
        ).strip()

        exam_date_text = request.form.get(
            "exam_date", ""
        ).strip()

        daily_hours_text = request.form.get(
            "daily_hours", "2"
        ).strip()

        uploaded_file = request.files.get("file")

        # Validate subject
        if not subject:
            return jsonify({
                "success": False,
                "error": "Please enter a subject."
            }), 400

        # Validate learning level
        if learning_level not in [
            "Beginner",
            "Intermediate",
            "Advanced"
        ]:
            return jsonify({
                "success": False,
                "error": "Invalid learning level."
            }), 400

        # Validate examination date
        if not exam_date_text:
            return jsonify({
                "success": False,
                "error": "Please select your examination date."
            }), 400

        try:
            exam_date = datetime.strptime(
                exam_date_text, "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "success": False,
                "error": "Invalid examination date."
            }), 400

        if exam_date <= date.today():
            return jsonify({
                "success": False,
                "error": "Please select a future examination date."
            }), 400

        # Validate daily study hours
        try:
            daily_hours = float(daily_hours_text)
        except ValueError:
            return jsonify({
                "success": False,
                "error": "Please enter valid daily study hours."
            }), 400

        if not 0.5 <= daily_hours <= 12:
            return jsonify({
                "success": False,
                "error": "Daily study hours must be between 0.5 and 12."
            }), 400

        # Read syllabus from PDF or manual topics
        syllabus_text = ""

        if uploaded_file and uploaded_file.filename:

            if not uploaded_file.filename.lower().endswith(".pdf"):
                return jsonify({
                    "success": False,
                    "error": "Only PDF syllabus files are supported."
                }), 400

            pdf_bytes = uploaded_file.read()

            if not pdf_bytes:
                return jsonify({
                    "success": False,
                    "error": "The uploaded PDF is empty."
                }), 400

            syllabus_text = extract_syllabus_pdf(pdf_bytes)

        elif topics:
            syllabus_text = topics[:12000]

        else:
            return jsonify({
                "success": False,
                "error": "Enter syllabus topics or upload a PDF."
            }), 400

        # Generate the personalised roadmap
        learning_path = generate_learning_path(
            subject=subject,
            syllabus_text=syllabus_text,
            learning_level=learning_level,
            exam_date=exam_date,
            daily_hours=daily_hours
        )

        return jsonify({
            "success": True,
            "message": "Learning path generated successfully.",
            "learning_path": learning_path
        }), 200

    except ValueError as e:
        print("Learning Path Validation Error:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:
        print("Learning Path Generation Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to generate your learning path. Please try again."
        }), 500
@learning_path_bp.route(
    "/api/save-learning-path",
    methods=["POST"]
)
@auth_required
def save_learning_path():

    try:
        data = request.get_json()

        if not data or not isinstance(data.get("learning_path"), dict):
            return jsonify({
                "success": False,
                "error": "Invalid learning path data."
            }), 400

        learning_path = data["learning_path"]

        if not isinstance(learning_path.get("daily_plan"), list):
            return jsonify({
                "success": False,
                "error": "Learning path has no valid daily plan."
            }), 400

        student_id = g.current_user["_id"]

        # Save the plan under the logged-in student's account
        document = {
            "student_id": student_id,
            "subject": learning_path.get("subject", "Untitled Subject"),
            "learning_path": learning_path,
            "completed_days": [],
            "completion_dates": [],
            "created_at": datetime.now(timezone.utc)
        }

        result = learning_paths_collection.insert_one(document)

        return jsonify({
            "success": True,
            "message": "Learning path added to your progress!",
            "learning_path_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        print("Save Learning Path Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to save your learning path."
        }), 500

@learning_path_bp.route(
    "/api/my-learning-paths",
    methods=["GET"]
)
@auth_required
def get_my_learning_paths():

    try:
        student_id = g.current_user["_id"]

        saved_paths = learning_paths_collection.find({
            "student_id": student_id
        }).sort("created_at", -1)

        learning_paths = []

        for item in saved_paths:
            learning_paths.append({
                "id": str(item["_id"]),
                "subject": item.get("subject", "Untitled Subject"),
                "learning_path": item.get("learning_path", {}),
                "completed_days": item.get("completed_days", []),
                "completion_dates": item.get("completion_dates", []),
                "created_at": item.get("created_at").isoformat()
                    if item.get("created_at") else None
            })

        return jsonify({
            "success": True,
            "learning_paths": learning_paths
        }), 200

    except Exception as e:
        print("Get Learning Paths Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to retrieve your learning paths."
        }), 500

@learning_path_bp.route(
    "/api/learning-path/<path_id>/day",
    methods=["PATCH"]
)
@auth_required
def update_learning_day(path_id):

    try:
        if not ObjectId.is_valid(path_id):
            return jsonify({
                "success": False,
                "error": "Invalid learning path ID."
            }), 400

        data = request.get_json() or {}

        day_number = data.get("day")
        completed = data.get("completed")

        if (
            not isinstance(day_number, int)
            or isinstance(day_number, bool)
            or day_number < 1
        ):
            return jsonify({
                "success": False,
                "error": "Invalid study day."
            }), 400

        if not isinstance(completed, bool):
            return jsonify({
                "success": False,
                "error": "Completion status must be true or false."
            }), 400

        student_id = g.current_user["_id"]

        saved_path = learning_paths_collection.find_one({
            "_id": ObjectId(path_id),
            "student_id": student_id
        })

        if not saved_path:
            return jsonify({
                "success": False,
                "error": "Learning path not found."
            }), 404

        daily_plan = (
            saved_path.get("learning_path", {}).get("daily_plan", [])
        )

        valid_days = [
            item.get("day")
            for item in daily_plan
            if isinstance(item, dict)
        ]

        if day_number not in valid_days:
            return jsonify({
                "success": False,
                "error": "This study day does not exist in the learning path."
            }), 400

        path_filter = {
            "_id": ObjectId(path_id),
            "student_id": student_id
        }

        if completed:
            # Remove an older date for this day before recording
            # the latest completion date.
            learning_paths_collection.update_one(
                path_filter,
                {
                    "$pull": {
                        "completion_dates": {
                            "day": day_number
                        }
                    }
                }
            )

            learning_paths_collection.update_one(
                path_filter,
                {
                    "$addToSet": {
                        "completed_days": day_number
                    },
                    "$push": {
                        "completion_dates": {
                            "day": day_number,
                            "completed_on": date.today().isoformat()
                        }
                    }
                }
            )

        else:
            learning_paths_collection.update_one(
                path_filter,
                {
                    "$pull": {
                        "completed_days": day_number,
                        "completion_dates": {
                            "day": day_number
                        }
                    }
                }
            )

        updated_path = learning_paths_collection.find_one(path_filter)

        return jsonify({
            "success": True,
            "message": "Study progress updated.",
            "completed_days": updated_path.get("completed_days", []),
            "completion_dates": updated_path.get("completion_dates", [])
        }), 200

    except Exception as e:
        print("Update Learning Day Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Unable to update study progress."
        }), 500
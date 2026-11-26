
from datetime import datetime, timedelta, timezone
import os
from urllib.parse import urlparse
from flask import (
    Blueprint, request, jsonify, current_app,
    send_from_directory, url_for
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from pathlib import Path
from uuid import uuid4
from database import users_collection
from auth_utils import (
    get_serializer,
    SESSION_COOKIE,
    SESSION_DURATION,
    auth_required
)

auth_bp = Blueprint("auth", __name__)
AVATAR_FOLDER = Path(__file__).resolve().parent.parent / "static" / "uploads" / "avatars"

ALLOWED_AVATAR_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB

def public_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "course": user.get("course", ""),
        "college": user.get("college", ""),
        "department": user.get("department", ""),
        "year_of_study": user.get("year_of_study", ""),
        "avatar": user.get("avatar", ""),
        "avatar_url": user.get("avatar_url", ""),
        "created_at": (
            user.get("created_at").isoformat()
            if user.get("created_at") else ""
        ),
        "role": user.get("role", "student")
    }

def create_session(response, user):
    token = get_serializer().dumps(str(user["_id"]))

    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DURATION,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="Lax",
        path="/"
    )

    return response


@auth_bp.route("/api/auth/register", methods=["POST"])
def register_student():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    course = data.get("course", "").strip()

    if not all([name, email, password, course]):
        return jsonify({
            "success": False,
            "error": "Please fill in all registration fields."
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "error": "Password must contain at least 8 characters."
        }), 400

    if users_collection.find_one({"email": email}):
        return jsonify({
            "success": False,
            "error": "An account with this email already exists."
        }), 409

    user = {
        "name": name,
        "email": email,
        "course": course,
        "password_hash": generate_password_hash(password),
        "role": "student",
        "created_at": datetime.now(timezone.utc)
    }

    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id

    response = jsonify({
        "success": True,
        "message": "Account created successfully.",
        "user": public_user(user)
    })

    response.status_code = 201
    return create_session(response, user)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login_student():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required."
        }), 400

    user = users_collection.find_one({"email": email})

    if not user or not check_password_hash(
        user.get("password_hash", ""),
        password
    ):
        return jsonify({
            "success": False,
            "error": "Invalid email or password."
        }), 401

    response = jsonify({
        "success": True,
        "message": "Signed in successfully.",
        "user": public_user(user)
    })

    return create_session(response, user)


@auth_bp.route("/api/auth/me", methods=["GET"])
@auth_required
def get_current_student():
    return jsonify({
        "success": True,
        "user": public_user(current_user())
    })


def current_user():
    from flask import g
    return g.current_user


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout_student():
    response = jsonify({
        "success": True,
        "message": "Signed out successfully."
    })

    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="Lax"
    )

    return response
@auth_bp.route("/api/auth/profile", methods=["GET"])
@auth_required
def get_student_profile():
    user = current_user()

    return jsonify({
        "success": True,
        "user": public_user(user)
    })

@auth_bp.route("/api/auth/profile", methods=["PUT"])
@auth_required
def update_student_profile():
    user = current_user()

    name = request.form.get("name", user.get("name", "")).strip()
    course = request.form.get("course", user.get("course", "")).strip()
    college = request.form.get("college", user.get("college", "")).strip()
    department = request.form.get("department", user.get("department", "")).strip()

    year_of_study = request.form.get(
        "year_of_study",
        user.get("year_of_study", "")
    ).strip()

    if not name:
        return jsonify({
            "success": False,
            "error": "Name cannot be empty."
        }), 400

    update_data = {
        "name": name,
        "course": course,
        "college": college,
        "department": department,
        "year_of_study": year_of_study
    }

    avatar_file = request.files.get("avatar")
    avatar_url = request.form.get("avatar_url", "").strip()

    new_avatar_filename = None
    avatar_changed = False

    # OPTION 1: Student selects an anime avatar
    if avatar_url:

        parsed_url = urlparse(avatar_url)

        # Allow only DiceBear Adventurer avatar URLs
        if (
            parsed_url.scheme != "https"
            or parsed_url.hostname != "api.dicebear.com"
            or parsed_url.path != "/9.x/adventurer/svg"
            or len(avatar_url) > 1000
        ):
            return jsonify({
                "success": False,
                "error": "Invalid avatar selection."
            }), 400

        update_data["avatar_url"] = avatar_url
        update_data["avatar"] = ""
        avatar_changed = True

    # OPTION 2: Student uploads a personal profile photo
    elif avatar_file and avatar_file.filename:

        original_filename = secure_filename(avatar_file.filename)

        extension = (
            original_filename.rsplit(".", 1)[-1].lower()
            if "." in original_filename else ""
        )

        if extension not in ALLOWED_AVATAR_EXTENSIONS:
            return jsonify({
                "success": False,
                "error": "Upload a JPG, JPEG, PNG or WEBP image."
            }), 400

        avatar_file.stream.seek(0, 2)
        file_size = avatar_file.stream.tell()
        avatar_file.stream.seek(0)

        if file_size > MAX_AVATAR_SIZE:
            return jsonify({
                "success": False,
                "error": "Avatar image must be smaller than 5 MB."
            }), 400

        AVATAR_FOLDER.mkdir(parents=True, exist_ok=True)

        new_avatar_filename = (
            f"{user['_id']}_{uuid4().hex}.{extension}"
        )

        avatar_file.save(AVATAR_FOLDER / new_avatar_filename)

        update_data["avatar"] = new_avatar_filename
        update_data["avatar_url"] = ""
        avatar_changed = True

    from datetime import datetime, timezone

    update_data["updated_at"] = datetime.now(timezone.utc)

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )

    # Remove the previous uploaded image when switching avatars.
    old_avatar = user.get("avatar", "")

    if avatar_changed and old_avatar:
        old_path = AVATAR_FOLDER / Path(old_avatar).name

        if old_path.is_file():
            old_path.unlink()

    updated_user = users_collection.find_one({
        "_id": user["_id"]
    })

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user": public_user(updated_user)
    })

@auth_bp.route("/api/auth/avatars/<filename>", methods=["GET"])
@auth_required
def get_student_avatar(filename):
    user = current_user()

    # Students can access only their own avatar.
    if filename != user.get("avatar"):
        return jsonify({
            "success": False,
            "error": "Avatar not found."
        }), 404

    return send_from_directory(AVATAR_FOLDER, filename)
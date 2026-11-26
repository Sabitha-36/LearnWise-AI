
from functools import wraps
from flask import request, jsonify, g, current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from bson import ObjectId

from database import users_collection

SESSION_COOKIE = "learnwise_session"
SESSION_DURATION = 7 * 24 * 60 * 60


def get_serializer():
    secret = current_app.config.get("SECRET_KEY")

    if not secret:
        raise RuntimeError("SECRET_KEY is missing from backend .env")

    return URLSafeTimedSerializer(
        secret,
        salt="learnwise-auth"
    )


def auth_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        token = request.cookies.get(SESSION_COOKIE)

        if not token:
            return jsonify({
                "success": False,
                "error": "Please sign in to continue."
            }), 401

        try:
            user_id = get_serializer().loads(
                token,
                max_age=SESSION_DURATION
            )

            user = users_collection.find_one({
                "_id": ObjectId(user_id)
            })

            if not user:
                raise BadSignature("Student account not found")

            g.current_user = user

        except (BadSignature, SignatureExpired, ValueError):
            return jsonify({
                "success": False,
                "error": "Your session has expired. Please sign in again."
            }), 401

        return function(*args, **kwargs)

    return wrapper

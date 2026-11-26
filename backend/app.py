
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from flask import Flask
from flask_cors import CORS
from routes.progress_routes import progress_bp

from database import db, users_collection
from routes.auth_routes import auth_bp
from routes.evaluation_routes import evaluation_bp
from routes.concept_routes import concept_bp
from routes.learning_path_routes import learning_path_bp
from routes.practice_routes import practice_bp
from routes.wisemind_routes import wisemind_bp
from routes.admin_routes import admin_bp
app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ]
)
# Ensure student email addresses are unique
users_collection.create_index("email", unique=True)

# Register API routes
app.register_blueprint(auth_bp)
app.register_blueprint(evaluation_bp)
app.register_blueprint(concept_bp)
app.register_blueprint(learning_path_bp)
app.register_blueprint(practice_bp)
app.register_blueprint(wisemind_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(progress_bp)
@app.route("/")
def home():
    return {"message": "LearnWise AI Backend Running"}


if __name__ == "__main__":
    print("Registered API Routes:")
    print(app.url_map)

    app.run(debug=True, port=5000)

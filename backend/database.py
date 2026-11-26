import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME", "learnwise")]

users_collection = db["users"]
evaluations_collection = db["evaluations"]
concepts_collection = db["concepts"]
learning_paths_collection = db["learning_paths"]
practice_sessions_collection = db["practice_sessions"]
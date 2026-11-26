
import os
import requests
import time
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

url = (
    f"https://generativelanguage.googleapis.com/v1beta/"
    f"models/{MODEL}:generateContent"
)

payload = {
    "contents": [
        {
            "parts": [
                {"text": "Explain Data Mining in two simple sentences."}
            ]
        }
    ]
}

print("Testing Gemini generation...")
print("Model:", MODEL)

start = time.time()

try:
    response = requests.post(
        url,
        headers={
            "x-goog-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=(15, 60)
    )

    print("HTTP Status:", response.status_code)
    print("Time taken:", round(time.time() - start, 2), "seconds")

    response.raise_for_status()

    result = response.json()
    answer = result["candidates"][0]["content"]["parts"][0]["text"]

    print("\nGemini Response:")
    print(answer)

except requests.exceptions.Timeout:
    print("ERROR: Gemini generation request timed out.")

except requests.exceptions.RequestException as error:
    print("HTTP/API ERROR:", error)

except (KeyError, IndexError) as error:
    print("Unexpected Gemini response:", error)

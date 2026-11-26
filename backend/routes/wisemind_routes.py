
from flask import Blueprint, request, jsonify, g

from services.concept_service import call_gemini
from auth_utils import auth_required


wisemind_bp = Blueprint(
    "wisemind",
    __name__,
    url_prefix="/api/wisemind"
)


@wisemind_bp.route("/chat", methods=["POST"])
@auth_required
def wisemind_chat():

    try:
        data = request.get_json(silent=True) or {}

        message = data.get("message", "").strip()
        history = data.get("history", [])

        # Validate user message
        if not message:
            return jsonify({
                "success": False,
                "error": "Please enter your question."
            }), 400

        if len(message) > 4000:
            return jsonify({
                "success": False,
                "error": "Your message is too long. Please shorten it."
            }), 400

        # Validate conversation history
        if not isinstance(history, list):
            return jsonify({
                "success": False,
                "error": "Invalid conversation history."
            }), 400

        # Keep only recent conversation turns
        history = history[-10:]

        conversation = []

        for item in history:

            if not isinstance(item, dict):
                continue

            role = item.get("role")
            content = item.get("content", "")

            if role not in ["user", "model"]:
                continue

            if not isinstance(content, str):
                continue

            if not content.strip():
                continue

            conversation.append({
                "text": f"{role.upper()}: {content[:4000]}"
            })

        # WiseMind personality and instructions
        prompt = """
You are Lisa AI, the intelligent academic assistant
of LearnWise AI.

Your purpose is to help college students understand
subjects, clarify doubts, prepare for examinations,
and improve their learning.

YOUR PERSONALITY:
- Friendly, supportive, patient and encouraging.
- Explain difficult concepts in simple language.
- Never make students feel embarrassed for asking doubts.
- Be interactive and approachable.

YOUR RESPONSIBILITIES:

1. Answer academic questions accurately.
2. Explain difficult concepts step by step.
3. Give simple examples and real-world applications.
4. Explain technical terms in understandable language.
5. Help with programming questions and code explanations.
6. Generate exam answers for 2, 5, 8 and 10 marks when requested.
7. Give short revision notes when requested.
8. Ask clarifying questions when a question is unclear.
9. Maintain context from the conversation.
10. Correct misunderstandings politely.

EXAM ANSWER FORMAT:
- 2 marks: Definition and key point.
- 5 marks: Introduction, explanation and example.
- 8 marks: Detailed explanation with headings and examples.
- 10 marks: Structured, comprehensive answer with suitable
  examples, diagrams described in text when appropriate,
  and a conclusion.

IMPORTANT:
- Prioritise correctness and clarity.
- Do not invent facts, references or page numbers.
- If you are uncertain, say so.
- Keep casual answers concise and educational explanations
  detailed enough to be useful.
- Stay focused on the student's learning.

You are Lisa AI. Do not claim to be a human teacher.
"""

        parts = [{"text": prompt}]

        # Add previous conversation context
        parts.extend(conversation)

        # Add current student question
        parts.append({
            "text": f"STUDENT: {message}\n\nLISA AI:"
        })

        # Generate response using existing Gemini service
        reply = call_gemini(parts)

        return jsonify({
            "success": True,
            "reply": reply
        }), 200

    except ValueError as e:
        print("Lisa Validation Error:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:
        print("Lisa Error:", str(e))

        return jsonify({
            "success": False,
            "error": "Lisa is temporarily unavailable. Please try again."
        }), 500

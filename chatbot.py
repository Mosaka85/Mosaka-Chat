from flask import Flask, request, jsonify, render_template
import os
import requests
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

import os
API_KEY = os.getenv("API_KEY")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"

# Store conversation history per user
conversation_history = {}

def chatbot_response(prompt, user_id):
    try:
        if user_id not in conversation_history:
            conversation_history[user_id] = []

        # Add user's prompt
        conversation_history[user_id].append({"role": "user", "text": prompt})

        parts = [{"text": msg["text"]} for msg in conversation_history[user_id]]

        payload = {
            "contents": [{"parts": parts}]
        }

        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)

        if response.status_code == 200:
            data = response.json()
            response_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Optional customization
            response_text = response_text.replace("Google", "MOSAKA Intelligence")

            conversation_history[user_id].append({"role": "assistant", "text": response_text})
            return response_text
        else:
            print("Gemini API error:", response.status_code, response.text)
            return "An error occurred while contacting Gemini API."
    except Exception as e:
        print("Error:", e)
        return "An unexpected error occurred."

@app.route("/")
def index():
    template_path = os.path.join(app.template_folder or "templates", "index.html")
    if not os.path.exists(template_path):
        return "Template 'index.html' not found in templates folder.", 404
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    prompt = data.get("prompt")
    user_id = data.get("user_id")

    if not prompt or not user_id:
        return jsonify({"error": "Both 'prompt' and 'user_id' are required."}), 400

    response = chatbot_response(prompt, user_id)
    return jsonify({"response": response})

@app.route("/new-conversation", methods=["POST"])
def new_conversation():
    data = request.get_json()
    user_id = data.get("user_id")

    if user_id:
        conversation_history[user_id] = []
        return jsonify({"message": "New conversation started."}), 200
    else:
        return jsonify({"error": "Missing user_id"}), 400

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

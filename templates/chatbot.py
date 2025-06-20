from flask import Flask, request, jsonify, render_template
import os
import google.generativeai as genai

app = Flask(__name__)

# Configure the Gemini API key (use environment variable)
api_key = "AIzaSyCBZyG0fVJfmnjOO0pEyrfUbkVDiCvt7gU"
if not api_key:
    raise ValueError("Missing GEMINI_API_KEY environment variable. Set it before running the app.")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-pro")


def chatbot_response(prompt):
    """Generates a response from the Gemini model with enhanced error handling."""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating response: {e}")
        # Consider more specific error handling based on exception type
        # (e.g., handle network errors differently from model timeouts)
        return "An error occurred. Please try again later."


@app.route("/")
def index():
    """Renders the chat interface template, ensuring it exists."""
    if not os.path.exists("MosakaChat.html"):
        raise FileNotFoundError("Chat interface template (MosakaChat.html) not found. Create it.")
    return render_template("MosakaChat.html")


@app.route("/chat", methods=["POST"])
def chat():
    """Handles chat requests, providing a user-friendly response for missing prompts."""
    user_input = request.json.get("prompt")

    print(f"Received input: {user_input}")

    if not user_input:
        return jsonify({"error": "Please provide a question or message to start the chat."}), 400

    response = chatbot_response(user_input)

    print(f"Generated bot response: {response}")

    return jsonify({"response": response})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
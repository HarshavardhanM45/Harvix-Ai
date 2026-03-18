import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def check_available():
    try:
        models = genai.list_models()
        print("Available models for this key:")
        for m in models:
            print(f"- {m.name}")
    except Exception as e:
        print("Error listing models:", e)

if __name__ == "__main__":
    check_available()

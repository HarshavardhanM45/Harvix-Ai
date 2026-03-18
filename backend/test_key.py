import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def test_key():
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.count_tokens("Hello world")
        print("Token Count:", response.total_tokens)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_key()

import google.generativeai as genai
import traceback
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def debug_gemini():
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        # Try a very simple call
        response = model.generate_content("Say hello")
        print("Response Success:", response.text)
    except Exception as e:
        print("--- EXCEPTION ---")
        print(traceback.format_exc())
        print("------------------")

if __name__ == "__main__":
    debug_gemini()

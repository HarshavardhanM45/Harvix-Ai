import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def test_gemini():
    domain = "Data Science"
    topics = "Statistics, Probability, Machine Learning, and Data Handling"
    
    prompt = f"""
    You are an expert technical interviewer for {domain}.
    Core Topics: {topics}.
    
    Current Interview History:
    No history yet.
    
    TASK: Analyze the history and generate a JSON response.
    1. EVALUATION: If the history is not empty, evaluate ONLY the very last answer. 
       Provide a 'score' from 0-10 and a brief 'feedback' string.
    2. NEXT QUESTION: Generate a STRICTLY UNIQUE next question. 
       - The next question MUST be 100% different from EVERY question in the history above.
       - STRICTLY avoid any semantic or literal repetition of topics, sub-concepts, or phrasing already present.
       - Randomly decide to either:
         a) Ask a deep-dive follow-up based on the PREVIOUS answer (if it doesn't repeat a question).
         b) Pivot to a random new sub-topic within {topics} that has NOT been covered yet.
    
    Return ONLY a JSON object:
    {{
        "evaluation": {{ "score": 0, "feedback": "string" }},
        "next_question": "string"
    }}
    if no history, evaluation should be null.
    """
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        print("Raw Response:", response.text)
        
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        print("Extracted Text:", text)
        result = json.loads(text)
        print("Parsed JSON:", result)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_gemini()

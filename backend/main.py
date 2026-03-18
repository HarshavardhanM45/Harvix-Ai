import os
import io
import uuid
import json
import random
import threading

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import speech_recognition as sr
from pydub import AudioSegment
import imageio_ffmpeg

# Force pydub to use the bundled ffmpeg binary (fixes WinError 2 on Windows)
AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

# --- PostgreSQL ---
from db import init_db
from auth import auth_bp
from progress import progress_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(progress_bp)

# Ensure DB tables exist
try:
    init_db()
except Exception as _e:
    print(f"[DB] Warning: Could not init database: {_e}")

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
AUDIO_FOLDER = os.path.join(DATA_DIR, 'audio_cache')
PERSISTENT_FILE = os.path.join(DATA_DIR, "persistent_questions.json")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

PERSONAS = [
    "Pragmatic Software Architect (focuses on scalability and system design)",
    "Academic Researcher (focuses on theoretical foundations and math)",
    "Fast-paced Startup CTO (focuses on speed, efficiency, and practical trade-offs)",
    "Detail-oriented Senior QA (focuses on edge cases and reliability)",
    "Beginner-friendly Mentor (focuses on clear explanations and core concepts)",
    "Strict Technical Lead (focuses on industry best practices and clean code)"
]

def load_persistent_asked():
    if os.path.exists(PERSISTENT_FILE):
        try:
            with open(PERSISTENT_FILE, 'r') as f:
                content = f.read().strip()
                return json.loads(content) if content else []
        except Exception as e:
            print(f"Error loading persistent questions: {e}")
            return []
    return []

def save_persistent_question(question):
    try:
        asked = load_persistent_asked()
        asked.append(question.strip().lower())
        # Keep only the last 500 questions to prevent bloat
        asked = asked[-500:]
        with open(PERSISTENT_FILE, 'w') as f:
            json.dump(asked, f)
    except Exception as e:
        print(f"Error saving persistent question: {e}")

@app.route('/api/upload_audio', methods=['POST'])
def upload_audio():
    """Receives recorded audio from the frontend, converts it, and transcribes it."""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    wav_filepath = None
    
    try:
        # Save the raw uploaded file (usually webm from frontend)
        file.save(filepath)
        
        # Convert to WAV using bundled ffmpeg directly (bypassing pydub and missing ffprobe completely)
        wav_filepath = filepath + ".wav"
        import subprocess
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ffmpeg_exe, "-y", "-i", filepath, wav_filepath], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Transcribe with SpeechRecognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_filepath) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
        
        return jsonify({"text": text})
    except sr.UnknownValueError:
        return jsonify({"text": "", "error": "Speech was unintelligible"}), 200
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup temporary audio files
        if os.path.exists(filepath):
            os.remove(filepath)
        if wav_filepath and os.path.exists(wav_filepath):
            os.remove(wav_filepath)

@app.route('/api/process', methods=['POST'])
def process_answer():
    """Processes the transcribed text and returns it."""
    data = request.json
    text = data.get('text', '')
    # Here you could add AI evaluation logic in the future
    return jsonify({"processed_text": text})

from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Gemini client setup failed: {e}")

# Configure Fallbacks
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Domain topics mapping
DOMAIN_TOPICS = {
    "Technical Interview": "Operating Systems, Computer Networks, DBMS, and Object-Oriented Programming (OOPS)",
    "Data Science": "Statistics, Probability, Machine Learning, and Data Handling",
    "AI & Machine Learning": "Deep Learning, Networks, Computer Vision, and NLP",
    "Full Stack Development": "Frontend, Backend, APIs, and Web Architectures",
    "Cloud Computing": "AWS, Azure, Docker, Kubernetes, and Serverless",
    "HR Interview": "Behavioral, Situational, and Culture-fit questions"
}

import time
import requests

def call_openrouter(prompt):
    """Fallback to OpenRouter if Gemini fails."""
    if not OPENROUTER_API_KEY or "placeholder" in OPENROUTER_API_KEY:
        return None, "OpenRouter API Key missing or placeholder."
    
    try:
        print("Falling back to OpenRouter...")
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "http://localhost:3000", # Optional
                "X-Title": "AI Mock Interview", # Optional
            },
            data=json.dumps({
                "model": "openrouter/auto",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            })
        )
        res_data = response.json()
        if "choices" in res_data:
            text = res_data['choices'][0]['message']['content'].strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            return json.loads(text), None
        else:
            return None, f"OpenRouter Error: {res_data.get('error', {}).get('message', 'Unknown error')}"
    except Exception as e:
        return None, f"OpenRouter Call Failed: {str(e)}"

def call_together(prompt):
    """Fallback to Together AI if Gemini fails."""
    if not TOGETHER_API_KEY:
        return None, "Together AI API Key missing."
    
    try:
        print("Falling back to Together AI...")
        response = requests.post(
            url="https://api.together.xyz/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {TOGETHER_API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "mistralai/Mistral-7B-Instruct-v0.3",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            })
        )
        res_data = response.json()
        if "choices" in res_data:
            text = res_data['choices'][0]['message']['content'].strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            return json.loads(text), None
        else:
            return None, f"Together AI Error: {res_data.get('error', {}).get('message', 'Unknown error')}"
    except Exception as e:
        return None, f"Together AI Call Failed: {str(e)}"

def call_gemini(prompt, models_to_try=[
    'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'
]):
    """Helper to try multiple Gemini models using the new genai SDK."""
    if not gemini_client:
        return None, "Gemini Client not initialized (Missing API Key)."
        
    for model_name in models_to_try:
        try:
            print(f"Calling Gemini with model: {model_name}")
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            text = response.text.strip()
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text), None
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini call failed with {model_name}: {error_msg}")
            if "429" in error_msg:
                print("Quota limit hit. Sleeping for 2 seconds before trying next model...")
                import time
                time.sleep(2)
                continue
    return None, "All 10+ Gemini models failed or Quota exceeded."

def call_llm(prompt):
    """Unified helper: Tries Gemini -> Together AI -> OpenRouter."""
    res, err = call_gemini(prompt)
    if res:
        return res, None
    
    print(f"Gemini failed: {err}. Trying Together AI fallback...")
    res, err = call_together(prompt)
    if res:
        return res, None

    print(f"Together AI failed: {err}. Trying OpenRouter fallback...")
    return call_openrouter(prompt)

@app.route('/api/get_next_question', methods=['POST'])
def get_next_question():
    """Strict AI logic: Evaluate -> Decide Difficulty -> Generate Unique Question."""
    data = request.json
    domain = data.get('domain', 'Computer Science').strip()
    history = data.get('history', []) 
    q_count = len(history) + 1  # current question number (1-indexed)
    
    print(f"DEBUG: Domain received: '{domain}', History len: {len(history)}, Q_Count: {q_count}")
    
    # SPECIAL HR LOGIC: Phase-based 11-question flow (Case-insensitive check)
    if "HR Interview" in domain or domain.lower() == "hr":
        print(f"DEBUG: Entering HR Logic Phase {q_count}")
        # 1. PHASE 1 (Q1): Mandatory Self-Intro
        if q_count == 1:
            return jsonify({
                "question": "To start our session, could you please tell me a bit about yourself, your background, and the key skills you bring to the table?",
                "id": str(uuid.uuid4()),
                "evaluation": {"score": 0, "feedback": "Welcome! Let's start with your introduction."}
            })
        
        # Determine HR Phase
        if 2 <= q_count <= 6:
            # 2. PHASE 2: Skill-based adaptation (One skill per question)
            self_intro = history[0].get('answer', 'General background')
            phase_context = f"Phase: Skill Exploration (Q{q_count}/11). Candidate background: {self_intro}"
            prompt_instruction = "Identify all skills/projects in the self-intro. Select ONE specific skill/project NOT yet discussed in history. Ask a focused behavioral/situational question about ONLY that skill."
        else:
            # 3. PHASE 3: General HR/Behavioral
            phase_context = f"Phase: General HR Behavioral (Q{q_count}/11)."
            prompt_instruction = "Ask the candidate a common HR behavioral question (e.g., conflict resolution, teamwork, or handling pressure). The question must be a direct interview question for the candidate to answer."
        
        topics = phase_context
    else:
        topics = DOMAIN_TOPICS.get(domain, "Core concepts and industry best practices")
    
    # 1. EVALUATE (if history exists)
    evaluation_result = {"score": 0, "feedback": ""}
    if history:
        last_item = history[-1]
        
        # Special handling for first HR evaluation (the self-intro)
        if domain == "HR Interview" and len(history) == 1:
            eval_prompt = f"""
            Role: HR Interviewer
            Question: {last_item['question']}
            Answer: {last_item['answer']}
            
            TASK: Acknowledge the introduction politely. Return ONLY a JSON object:
            {{
                "score": 8.0,
                "feedback": "Thank you for that introduction. It's great to hear about your background."
            }}
            """
        else:
            eval_prompt = f"""
            Role: { "HR Manager" if domain == "HR Interview" else "Technical Interviewer" }
            Context: {domain} ({topics})
            Question: {last_item['question']}
            Answer: {last_item['answer']}
            
            TASK: Evaluate the answer and return ONLY a JSON object:
            {{
                "score": decimal (0-10),
                "feedback": "constructive feedback string"
            }}
            """
        res, err = call_llm(eval_prompt)
        if res:
            evaluation_result = res
        else:
            print(f"Evaluation step failed: {err}")

    # 2. DECIDE DIFFICULTY
    last_score = evaluation_result.get('score', 0)
    current_difficulty = "Easy"
    if history:
        if last_score > 6:
            current_difficulty = "Medium"
            if len(history) > 4: current_difficulty = "Hard"
        elif len(history) >= 2 and last_score <= 4:
            current_difficulty = "Easy"
        else:
            if len(history) < 3: current_difficulty = "Easy"
            elif len(history) < 6: current_difficulty = "Medium"
            else: current_difficulty = "Hard"

    # 3. GENERATE UNIQUE QUESTION
    asked_texts = [item['question'].lower().strip() for item in history]
    global_asked = load_persistent_asked()
    forbidden_list = list(set(asked_texts + global_asked[-200:]))
    persona = random.choice(PERSONAS) if domain != "HR Interview" else "Experienced HR Manager"
    
    max_gen_retries = 3
    final_next_q = None
    last_error = "Unknown error"

    for retry_count in range(max_gen_retries):
        if "HR Interview" in domain or domain.lower() == "hr":
            gen_prompt = f"""
            Role: Experienced HR Manager currently interviewing a candidate.
            Context: {phase_context}
            Target Difficulty: {current_difficulty}
            Forbidden Questions (DO NOT REPEAT): {forbidden_list}
            
            TASK: {prompt_instruction}
            Ensure the question is a DIRECT interview question for the candidate, unique, and concise (1-2 sentences).
            Return ONLY a JSON object:
            {{ "next_question": "string" }}
            """
        else:
            gen_prompt = f"""
            Role: {persona}
            Domain: {domain}
            Topics: {topics}
            Target Difficulty: {current_difficulty}
            Forbidden Questions (DO NOT ASK): {forbidden_list}
            
            TASK: Generate a 100% NEW, UNIQUE, and CONCISE technical question (1-2 sentences).
            Focus on a single concept. 
            Return ONLY a JSON object:
            {{ "next_question": "string" }}
            """
        res, err = call_llm(gen_prompt)
        if res:
            next_q = res.get("next_question", "").strip()
            if next_q and next_q.lower() not in [q.lower() for q in forbidden_list]:
                final_next_q = next_q
                save_persistent_question(final_next_q)
                break
            else:
                print(f"Duplicate detected: {next_q}. Retry {retry_count+1}/{max_gen_retries}...")
                last_error = "Duplicate question generated."
        else:
            last_error = err
            print(f"Generation attempt {retry_count+1} failed: {err}")

    if not final_next_q:
        return jsonify({
            "error": "Failed to generate a unique question from Gemini.",
            "details": last_error
        }), 500

    return jsonify({
        "question": final_next_q,
        "id": str(uuid.uuid4()),
        "evaluation": evaluation_result
    })

@app.route('/api/generate_mcqs', methods=['POST'])
def generate_mcqs():
    """Generates 10 MCQs for a topic using LLM."""
    data = request.json
    topic = data.get('topic', 'General Computer Science')
    
    prompt = f"""
    Role: Senior Technical Interviewer and Educator.
    Topic: {topic}
    
    TASK: Generate exactly 10 Multiple Choice Questions (MCQs) for the topic '{topic}'.
    The questions must follow this difficulty progression:
    - Questions 1-3: Easy (Fundamental concepts)
    - Questions 4-7: Medium (Implementation, mechanisms, and logic)
    - Questions 8-10: Hard (Complex scenarios, optimization, and advanced internals)
    
    CRITICAL REQUIREMENTS:
    1. Each question must have exactly 4 options.
    2. There must be exactly one correct answer (index 0-3).
    3. Provide a concise explanation (1-2 sentences) for why the answer is correct.
    4. Ensure all questions are unique and technically accurate.
    5. Return ONLY a valid JSON array of objects.
    
    JSON Format Example:
    [
      {{
        "question": "What is...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "This is correct because..."
      }},
      ...
    ]
    """
    
    res, err = call_llm(prompt)
    if res:
        if isinstance(res, list) and len(res) >= 10:
            return jsonify(res[:10])
        elif isinstance(res, dict) and "questions" in res:
            return jsonify(res["questions"][:10])
        return jsonify(res)
    else:
        return jsonify({"error": "Failed to generate MCQs", "details": err}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Interview API"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)

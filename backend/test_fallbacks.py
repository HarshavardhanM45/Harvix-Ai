import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY_TEST") or os.getenv("TOGETHER_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def test_together():
    print("Testing Together AI...")
    try:
        response = requests.post(
            url="https://api.together.xyz/v1/chat/completions",
            headers={"Authorization": f"Bearer {TOGETHER_API_KEY}", "Content-Type": "application/json"},
            data=json.dumps({
                "model": "mistralai/Mistral-7B-Instruct-v0.3",
                "messages": [{"role": "user", "content": "Hello, return JSON: {'test': 'ok'}"}]
            }),
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Together AI Error: {e}")

def test_openrouter():
    print("\nTesting OpenRouter...")
    # List of free models to try
    models = ["google/gemma-2-9b-it:free", "mistralai/mistral-7b-instruct:free", "openrouter/auto"]
    for model in models:
        print(f"Trying model: {model}")
        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"},
                data=json.dumps({
                    "model": model,
                    "messages": [{"role": "user", "content": "Hello, return JSON: {'test': 'ok'}"}]
                }),
                timeout=10
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            if response.status_code == 200:
                break
        except Exception as e:
            print(f"OpenRouter Error: {e}")

if __name__ == "__main__":
    test_together()
    test_openrouter()

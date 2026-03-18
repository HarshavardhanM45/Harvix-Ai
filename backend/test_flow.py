import requests
import json
import time

def test_logic_flow():
    url = "http://127.0.0.1:5000/api/get_next_question"
    headers = {'Content-Type': 'application/json'}
    
    # 1. First question
    print("Step 1: First Question...")
    res1 = requests.post(url, json={"domain": "Full Stack Development", "history": []}, headers=headers)
    data1 = res1.json()
    q1 = data1.get('question')
    print(f"Q1: {q1}")
    
    # 2. Answer and evaluate
    print("\nStep 2: Submit Answer & Get Next...")
    history2 = [
        {"question": q1, "answer": "REST is an architectural style for distributed hypermedia systems."}
    ]
    res2 = requests.post(url, json={"domain": "Full Stack Development", "history": history2}, headers=headers)
    data2 = res2.json()
    eval2 = data2.get('evaluation')
    q2 = data2.get('question')
    print(f"Evaluation: {eval2}")
    print(f"Q2: {q2}")
    
    if q1 != q2:
        print("\nSUCCESS: Flow completed correctly.")
    else:
        print("\nFAILURE: Questions are identical.")

if __name__ == "__main__":
    time.sleep(2)
    test_logic_flow()

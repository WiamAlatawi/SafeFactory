import os
import json
import re
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

KB_PATH = "data/failure_knowledge_base.csv"
BINARY_MODEL_PATH = "Model/binary_failure_model.pkl"
MULTICLASS_MODEL_PATH = "Model/multiclass_failure_model.pkl"

Features = ["Type", "Air temperature K", "Process temperature K", "Rotational speed rpm", "Torque Nm", "Tool wear min"]
type_map = {'L': 0, 'M': 1, 'H': 2}
current_machine = {
    "Type": None,
    "Air temperature K": None,
    "Process temperature K": None,
    "Rotational speed rpm": None,
    "Torque Nm": None,
    "Tool wear min": None,
}


def load_pipeline():
    for path in (KB_PATH, BINARY_MODEL_PATH, MULTICLASS_MODEL_PATH):
        if not os.path.exists(path):
            raise FileNotFoundError(path)

    kb = pd.read_csv(KB_PATH)
    binary_model = joblib.load(BINARY_MODEL_PATH)
    multiclass_model = joblib.load(MULTICLASS_MODEL_PATH)
    retrieve = _build_retriever(kb)
    return {
        'kb': kb,
        "binary_model": binary_model["model"],
        "binary_threshold": binary_model.get("threshold", 0.5),
        "multiclass_model": multiclass_model["model"],
        "label_encoder": multiclass_model["label_encoder"],
        "retrieve": retrieve,
    }


def _build_retriever(kb):
    def row_to_text(row):
        return f"""
        Failure Type: {row['Failure_Type']}

        Description:
        {row['Description']}

        Symptoms:
        {row['Symptoms']}

        Typical Indicators:
        {row['Typical_Indicators']}

        Root Cause:
        {row['Root_Cause']}

        Severity:
        {row['Severity']}

        Priority:
        {row['Priority']}

        Estimated Cost:
        {row['Estimated_Cost_USD']} USD

        Downtime:
        {row['Downtime_Hours']} hours

        Recommendations:
        - {row['Recommendation_1']}
        - {row['Recommendation_2']}
        - {row['Recommendation_3']}

        Prevention:
        {row['Prevention']}

        FAQ:
        {row['FAQ']}
        """

    docs = kb.apply(row_to_text, axis=1).tolist()
    vectorizer = TfidfVectorizer(stop_words='english')
    matrix = vectorizer.fit_transform(docs)

    def retrieve(query, top_k=1):
        q_vec = vectorizer.transform([query])
        sims = cosine_similarity(q_vec, matrix).flatten()
        top_idx = sims.argsort()[::-1][:top_k]
        results = kb.iloc[top_idx].copy()
        results['similarity'] = sims[top_idx]
        return results

    return retrieve


def openai_key():
    return bool(os.getenv('OPENAI_API_KEY'))


def _call_openai(prompt, model='gpt-4o-mini'):
    client = OpenAI()
    response = client.chat.completions.create(
        model=model,
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=400,
    )
    return response.choices[0].message.content


def extract_sensor_readings(question: str):
    if not openai_key():
        return None
    prompt = f"""
    Extract machine sensor readings from the text.

    Recognize these synonyms:

    Machine Type:
    - L
    - l
    - low
    - light
    - machine l

    - M
    - m
    - mid
    - medium
    - machine m

    - H
    - h
    - high
    - heavy
    - machine h

    Air Temperature:
    air temp
    ambient temp

    Process Temperature:
    process temp

    Rotational Speed:
    speed
    rpm
    rotation speed

    Torque:
    torque

    Tool Wear:
    wear
    tool wear

    Return ONLY valid JSON.

    {{
    "Type": "L|M|H|null",
    "Air temperature K": number|null,
    "Process temperature K": number|null,
    "Rotational speed rpm": number|null,
    "Torque Nm": number|null,
    "Tool wear min": number|null
    }}

    Text:

    {question}
    """
    raw = _call_openai(prompt)
    raw = re.sub(r'```json|```', '', raw).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return data


def predict_failure(sensor_input: dict, pipeline: dict):
    row = sensor_input.copy()
    row['Type'] = type_map.get(row['Type'], row['Type'])
    X = pd.DataFrame([row])[Features]

    fail_prob = float(pipeline['binary_model'].predict_proba(X)[0, 1])
    will_fail = bool(fail_prob >= pipeline['binary_threshold'])

    if not will_fail:
        return {'will_fail': False, 'failure_type': None, 'fail_prob': fail_prob}

    pred_idx = pipeline['multiclass_model'].predict(X)[0]
    failure_type = pipeline['label_encoder'].inverse_transform([pred_idx])[0]
    return {'will_fail': True, 'failure_type': failure_type, 'fail_prob': fail_prob}


def answer_question(question: str, pipeline: dict, use_llm: bool = True):
    sensor_input = extract_sensor_readings(question) if use_llm else None

    if sensor_input:
        for key, value in sensor_input.items():
            if value is not None:
                current_machine[key] = value
    
    missing = [f for f in Features if current_machine[f] is None]
    if missing:
        return("I have recorded the information you provided.\n\n"
               "I still need:\n\n" + "\n".join(f"• {m}" for m in missing)
                           )
    sensor_input = current_machine.copy()

    if sensor_input:
        prediction = predict_failure(sensor_input, pipeline)

        if not prediction['will_fail']:
            match = pipeline["retrieve"]("No Failure").iloc[0]
            prompt = f"""
                You are a customer-friendly machine health assistant.

                The machine learning model has already made the prediction.

                Never change the prediction.

                Machine status:
                Healthy

                Chance of a problem:
                {prediction['fail_prob']:.2%}

                Machine information:
                {json.dumps(sensor_input, indent=2)}

                Knowledge base:
                {json.dumps(match.to_dict(), indent=2)}

                Explain the result for a non-technical user.

                Include:

                - A simple explanation that the machine appears to be operating normally.
                - Explain what this means in everyday language.
                - Mention anything worth monitoring.
                - Suggest simple preventive maintenance.
                - Avoid technical jargon.
                - Do not list raw sensor values unless necessary.
                - Keep the answer short and friendly.
                """

            return _call_openai(prompt)

        failure_type = prediction['failure_type']
        match = pipeline['retrieve'](f"failure type {failure_type}", top_k=1).iloc[0]

        if use_llm and openai_key():
            prompt = f"""
            You are a customer-friendly machine health assistant.

            The machine learning model has already made the prediction.

            Never change the prediction.

            Customer question:
            {question}

            Machine status:
            Attention Recommended

            Predicted issue:
            {failure_type}

            Chance of this issue:
            {prediction['fail_prob']:.2%}

            Machine information:
            {json.dumps(sensor_input, indent=2)}

            Knowledge base:
            {json.dumps(match.to_dict(), indent=2)}

            Answer for someone with no engineering background.

            Explain:

            - What the problem means in simple language.
            - Why maintenance is recommended.
            - What could happen if ignored.
            - Whether the issue should be addressed soon.
            - Simple maintenance recommendations.
            - Estimated repair cost if available.
            - Ways to help prevent this issue in the future.

            Avoid technical jargon.
            Do not mention machine learning or sensor values.
            Do not invent another problem.
            """
            return _call_openai(prompt)

        recs = [match['Recommendation_1'], match['Recommendation_2'], match['Recommendation_3']]
        return (
            f"Predicted failure type: {failure_type} (probability: {prediction['fail_prob']:.2f})\n"
            f"Root cause: {match['Root_Cause']}\n"
            f"Priority: {match['Priority']}\n"
            f"Estimated cost: ${match['Estimated_Cost_USD']:,.0f} ({match['Cost_Percentage']}% of total)\n"
            "Recommended actions:\n" + "\n".join(f" - {r}" for r in recs)
        )

    match = pipeline['retrieve'](question, top_k=1).iloc[0]

    if use_llm and openai_key():
        prompt = f"""
            You are a customer-friendly machine health assistant.

            The machine learning model has already made the prediction.

            Never change the prediction.

            Customer question:
            {question}

            Machine information:
            {json.dumps(sensor_input, indent=2)}

            Prediction:

            Problem:
            {failure_type}

            Chance of the problem:
            {prediction['fail_prob']:.2%}

            Knowledge base:
            {json.dumps(match.to_dict(), indent=2)}

            Answer in clear, simple language.

            Your response should:

            - Explain what the predicted issue means.
            - Explain why maintenance is recommended.
            - Describe the possible impact if ignored.
            - Suggest practical next steps.
            - Mention the estimated repair cost if available.
            - Explain how similar issues can be prevented.

            Avoid engineering terms.
            Do not mention machine learning.
            Do not invent another prediction.
            """
        return _call_openai(prompt)

    return ( 
        f"Closest match: {match['Failure_Type']} (similarity: {match['similarity']:.2f})\n"
        f"Root cause: {match['Root_Cause']}\n"
        f"Priority: {match['Priority']}\n"
        f"Recommendations: {match['Recommendation_1']}; {match['Recommendation_2']}; "
        f"{match['Recommendation_3']}"
    )


if __name__ == '__main__':
    pipeline = load_pipeline()
    print("SafeFactory assistant ready. Type 'q' to quit.")
    # print("Ask a question, or paste sensor readings, e.g.:")
    # print('Machine type L, air temp 301.5 K, process temp 310.9 K, speed 2760 rpm, torque 8 Nm, tool wear 15 min — will it fail?\n')
    while True:
        question = input("You: ")
        if question.strip().lower() == 'q':
            break
        if question.strip().lower() == "r":
            for k in current_machine:
                current_machine[k] = None
            print("Machine information cleared.\n")
            continue
        print(answer_question(question, pipeline, use_llm=True))
        print()

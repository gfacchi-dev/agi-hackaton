from ollama import chat
import json

def main():
    # Load the patient data
    with open('assets/dx.txt', 'r') as f:
        dx_data = f.read()

    with open('assets/fhir.json', 'r') as f:
        fhir_data = json.load(f)

    # Engineer the prompt
    prompt = f"""
    You are a helpful medical assistant. Your task is to generate a pre-chart summary in concise clinical assessment documentation (ccad) format for a physician.
    Here is the available patient information.

    First, a consultation note regarding a skin lesion:
    ---
    {dx_data}
    ---

    Second, the patient's electronic health record data in FHIR format:
    ---
    {json.dumps(fhir_data)}
    ---

    Please generate a concise and medically relevant pre-chart report. The report should include:
    1. Patient Demographics (Name, Age, Gender).
    2. Reason for Visit / Chief Complaint (from the consultation note).
    3. Active Medical History (from the FHIR data).
    4. Current Medications (from the FHIR data).
    5. Allergies (from the FHIR data).
    6. Relevant Recent Labs and Vitals (from the FHIR data).
    7. Summary of the presenting problem (from the consultation note), including assessment and plan.

    Organize the output clearly with headings for each section.
    """

    stream = chat(
        model='alibayram/medgemma:27b',
        messages=[{'role': 'user', 'content': prompt}],
        stream=True,
    )
    
    print('ready')

    for chunk in stream:
        print(chunk['message']['content'], end='', flush=True)


if __name__ == "__main__":
    main()

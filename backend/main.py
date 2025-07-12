from ollama import chat
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi.websockets import WebSocket
import uvicorn
from langchain_ollama import ChatOllama
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
import json
import re
import time

class PreChartParser(BaseOutputParser):
    def parse(self, text: str) -> dict:
        report_match = re.search(r"<report>(.*?)</report>", text, re.DOTALL)
        question_match = re.search(r"<question>(.*?)</question>", text, re.DOTALL)

        return {
            "report": report_match.group(1).strip() if report_match else "",
            "question": question_match.group(1).strip() if question_match else ""
        }

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

text = open("assets/pre-chart-initial.md").read()
current_report = text
previous_questions = []

async def generate_summary_stream():
    """Generator function to stream the Ollama response."""
    prompt = get_prompt()
    if prompt is None:
        yield "Error creating prompt."
        return

    stream = chat(
        model='alibayram/medgemma:27b',
        messages=[{'role': 'user', 'content': prompt}],
        stream=True,
    )

    for chunk in stream:
        yield chunk['message']['content']

async def generate_summary():
    """Function to get the full Ollama response."""
    prompt = get_prompt()
    if prompt is None:
        return "Error creating prompt."

    response = chat(
        model='alibayram/medgemma:27b',
        messages=[{'role': 'user', 'content': prompt}],
        stream=False,
    )
    return response['message']['content']

@app.get("/really-fake", response_class=PlainTextResponse)
async def generate_summary_endpoint_really_fake():
    """FastAPI endpoint to generate and return the full medical pre-chart summary."""
    return current_report 

@app.websocket("/stream-patient")
async def websocket_endpoint(websocket: WebSocket):
    global current_report, previous_questions
    await websocket.accept()
    print("\n--- WebSocket Connection Established ---")

    try:
        while True:
            # Receive a new message from the frontend (e.g. patient's answer)
            patient_response = await websocket.receive_text()
            print(f"\n[Backend] Received patient response: {patient_response}")

            if patient_response == "start":
                current_report = text  # Reset the report to initial state
                previous_questions = []
                continue

            if patient_response == "FAKE":
                response_data = {
                    "report": current_report, # Send the cleaned and stored report
                    "question": "Happy to help you! Please provide me with an image showing your symptoms and provide some details about your condition."
                }
                
                print(f"FAKE TRIGGERED")
                time.sleep(4)
                await websocket.send_text(json.dumps(response_data))
                continue

            # Append the previous question and patient answer for context
            if previous_questions:
                last_question = previous_questions[-1]
                previous_questions[-1] = f"{last_question} (Patient answered: {patient_response})"

            # Define the LangChain prompt
            prompt = PromptTemplate(
                input_variables=["current_report", "previous_questions", "latest_patient_response"],
                template="""You are a helpful medical assistant. Your role is to complete a clinical pre-chart in concise clinical assessment documentation (CCAD) format for a physician.

You have a partially completed report:

<report>
{current_report}
</report>

Previously asked questions:
{previous_questions}

The patient just said:
{latest_patient_response}

Your task is to update the report and decide if further information is needed.

Follow these strict rules:

1. Only update content within the existing sections. Do not add new sections, summaries, or reorder anything.
2. Only include facts directly confirmed by the patient or safely inferred. No assumptions or placeholders.
3. Use plain, patient-friendly language. Avoid clinical jargon, diagnostic terms, or frameworks like ABCDE.
4. No future plans, interpretations, or medical advice.
5. If the report is incomplete, ask one atomic, plain-language question (no multi-part or compound questions).
6. If the report is complete and ready for physician review, state that no further questions are needed.

Respond in one of these formats:

---

✅ If new info was added and more is needed:

<report>
[Updated report: only new confirmed info added to existing sections]
</report>

<question>
[One specific, plain-language question]
</question>

---

✅ If the report is now complete:

<report>
[Final, complete report — structure preserved, all info confirmed]
</report>

<question>
That’s all the information needed before your visit. Would you like me to schedule a visit for you?
</question>"""
            )

            # Set up LangChain chain using LCEL
            llm = ChatOllama(model='alibayram/medgemma:27b')
            parser = PreChartParser()
            chain = prompt | llm | parser

            # Run the chain
            result = await chain.ainvoke({
                "current_report": current_report,
                "previous_questions": "\n".join(previous_questions),
                "latest_patient_response": patient_response
            })

            # The LLM returns a string with literal '\n' characters. Replace them with actual newlines.
            # Then, replace single newlines with double newlines to ensure proper markdown paragraph rendering.
            formatted_report = result["report"].replace('\\n', '\n').replace('\n', '\n\n')
            next_question = result["question"]
            previous_questions.append(next_question)

            # Update state
            current_report = formatted_report

            # Send clean JSON back to client
            response_data = {
                "report": current_report, # Send the cleaned and stored report
                "question": next_question
            }

            print(f"[Backend] Sending data to client: {json.dumps(response_data, indent=2)}")
            await websocket.send_text(json.dumps(response_data))

    except WebSocketDisconnect:
        print("WebSocket disconnected.")
        
@app.websocket("/stream-report")
async def websocket_endpoint_report(websocket: WebSocket):
    await websocket.accept()
    print("\n--- WebSocket Connection Established ---")
    try:
        while True:
            await websocket.send_text(current_report)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("WebSocket disconnected.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8006, reload=True)

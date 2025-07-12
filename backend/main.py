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

            # Append the previous question and patient answer for context
            if previous_questions:
                last_question = previous_questions[-1]
                previous_questions[-1] = f"{last_question} (Patient answered: {patient_response})"

            # Define the LangChain prompt
            prompt = PromptTemplate(
                input_variables=["current_report", "previous_questions"],
                template="""
                You are a helpful medical assistant. Your role is to interact with the patient to complete a clinical pre-chart in concise clinical assessment documentation (CCAD) format for a physician.

You already have a partially completed pre-chart report based on prior information.

<report>
{current_report}
</report>

Here are the previous questions you have already asked the patient:
{previous_questions}

Your task is to identify what additional information is needed to make the report complete, medically useful, and ready for physician review.

⚠️ You must follow these strict rules:

1. You must preserve and continue the structure, style, and content categories used in the current report — do not add, remove, or rename sections.
2. Only include **confirmed or directly inferred information** in the updated report.
3. Do **not** add hypothetical plans, future actions, placeholders like "[information needed]", or questions in the report.
4. If no new information is available for a section, simply leave that section unchanged.
5. Then, propose **one clear and specific question** for the patient to fill in the most relevant gap in the report.

Your response must strictly follow this format:

<report>
[Updated report: only confirmed facts, no assumptions or placeholders; structure and order must match the original]
</report>

<question>
[Exactly one clear, specific question for the patient — no multi-part or compound questions]
</question>
                """
            )

            # Set up LangChain chain using LCEL
            llm = ChatOllama(model='alibayram/medgemma:27b')
            parser = PreChartParser()
            chain = prompt | llm | parser

            # Run the chain
            result = await chain.ainvoke({
                "current_report": current_report,
                "previous_questions": "\n".join(previous_questions)
            })

            # Update state
            current_report = result["report"]
            next_question = result["question"]
            previous_questions.append(next_question)

            # Send clean JSON back to client
            response_data = {
                "report": current_report, # Send the cleaned and stored report
                "question": next_question
            }
            print(f"[Backend] Sending data to client: {json.dumps(response_data, indent=2)}")
            await websocket.send_text(json.dumps(response_data))

    except WebSocketDisconnect:
        print("WebSocket disconnected.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8005, reload=True)

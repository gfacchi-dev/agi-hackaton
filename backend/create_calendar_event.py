import os
from dotenv import load_dotenv
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet, Action, App

load_dotenv()

llm = ChatOpenAI(api_key=os.environ["OPENAI_KEY"])
prompt = hub.pull("hwchase17/openai-functions-agent")

composio_toolset = ComposioToolSet(api_key=os.environ["COMPOSIO_KEY"])
tools = composio_toolset.get_tools(actions=['GOOGLECALENDAR_CREATE_EVENT'])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

def create_calendar_event(task: str) -> str:
    result = agent_executor.invoke({"input": f"{task} San Francisco Time, year 2025. The title is Medmind Appointment"})
    return result


if __name__ == "__main__":
    task = "Create a calendar event for a meeting with John Doe on March 15, 2024, at 10 AM."
    response = create_calendar_event(task)
    print(response)


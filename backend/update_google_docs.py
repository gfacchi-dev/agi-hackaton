from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet, Action, App

llm = ChatOpenAI()
prompt = hub.pull("hwchase17/openai-functions-agent")

composio_toolset = ComposioToolSet(api_key="6zio1e0v69dsdq64riguh8")
tools = composio_toolset.get_tools(actions=['GOOGLEDOCS_UPDATE_DOCUMENT_MARKDOWN'])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
task = "your task description here"
result = agent_executor.invoke({"input": task})

def create_calendar_event(task: str) -> str:
    result = agent_executor.invoke({"input": f"{task}"})
    return result

if __name__ == "__main__":
    task = "Create a calendar event for a meeting with John Doe on March 15, 2024, at 10 AM."
    response = create_calendar_event(task)
    print(response)
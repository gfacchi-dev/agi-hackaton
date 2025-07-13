from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet, Action, App

import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(api_key=os.environ["OPENAI_KEY"])
prompt = hub.pull("hwchase17/openai-functions-agent")

composio_toolset = ComposioToolSet(api_key=os.environ["COMPOSIO_KEY"])
tools = composio_toolset.get_tools(actions=['GOOGLEDOCS_CREATE_DOCUMENT_MARKDOWN'])
agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
task = "your task description here"
result = agent_executor.invoke({"input": task})

def update_google_docs(task: str) -> str:
    result = agent_executor.invoke({"input": f"{task}"})
    return result

if __name__ == "__main__":
    content = "I like pineapples because they are sweet!"
    task = f"Write the following into document: {content}"
    response = update_google_docs(task)
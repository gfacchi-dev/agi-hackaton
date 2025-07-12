from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet, Action, App

llm = ChatOpenAI()
prompt = hub.pull("hwchase17/openai-functions-agent")

composio_toolset = ComposioToolSet(api_key="0jdt3a1491plnpljcykxjel")
tools = composio_toolset.get_tools(actions=['GOOGLECALENDAR_CREATE_EVENT'])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
task = "your task description here"
result = agent_executor.invoke({"input": task})
print(result)
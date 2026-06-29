import os

from deepagents import create_deep_agent
from deepagents.backends import CompositeBackend, FilesystemBackend, StateBackend
from langchain.agents.middleware import (
    DockerExecutionPolicy,
    ShellToolMiddleware,
)
from langchain.agents.middleware.shell_tool import ShellSession
from langchain_openai import ChatOpenAI
from mcp_tools import get_mcp_tools
from middleware.image import ImageResizeMiddleware
from middleware.system_context import SystemContextMiddleware
from tools import tools as local_tools

# temporary fix
ShellSession.__deepcopy__ = lambda self, memo: self
ShellSession.__getstate__ = lambda self: {}
ShellSession.__setstate__ = lambda self, state: None

llm_url = os.environ.get("LLM_URL")
llm_model = os.environ["LLM_MODEL"]
llm = ChatOpenAI(base_url=llm_url, model=llm_model, openai_api_key="docker")

mcp_tools = get_mcp_tools()

agent = create_deep_agent(
    name="open-gem-agent",
    model=llm,
    tools=mcp_tools + local_tools,
    middleware=[
        SystemContextMiddleware(),
        ImageResizeMiddleware(),
        ShellToolMiddleware(
            execution_policy=DockerExecutionPolicy(
                image="python:3.14-slim",
                command_timeout=60.0,
            ),
        ),
    ],
    backend=CompositeBackend(
        default=FilesystemBackend(root_dir="/app/workspace/", virtual_mode=True),
        routes={
            "/tmp/": StateBackend(),
        },
    ),
    skills=["/skills/"],
)

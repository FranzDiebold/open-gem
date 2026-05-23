import asyncio
import json
from pathlib import Path

from langchain_mcp_adapters.client import MultiServerMCPClient


def get_mcp_tools():
    config_dir = Path(__file__).resolve().parent / "workspace" / "config"
    with open(config_dir / "mcp_servers.json", "r") as f:
        mcp_servers = json.load(f)

    client = MultiServerMCPClient(mcp_servers)

    return asyncio.run(client.get_tools())

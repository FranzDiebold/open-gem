import asyncio
import json
import os
from pathlib import Path

from langchain_mcp_adapters.client import MultiServerMCPClient


def _expand_env_vars(obj):
    if isinstance(obj, dict):
        return {k: _expand_env_vars(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_expand_env_vars(v) for v in obj]
    if isinstance(obj, str):
        return os.path.expandvars(obj)
    return obj


def get_mcp_tools():
    config_dir = Path(__file__).resolve().parent / "workspace" / "config"
    with open(config_dir / "mcp_servers.json", "r") as f:
        mcp_servers = _expand_env_vars(json.load(f))

    client = MultiServerMCPClient(mcp_servers)

    return asyncio.run(client.get_tools())

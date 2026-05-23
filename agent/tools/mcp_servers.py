import json
from pathlib import Path
from typing import Literal, TypedDict

from langchain.tools import tool


class MCPServer(TypedDict):
    command: str
    args: list[str]
    transport: Literal["stdio", "sse", "websocket", "http"]


MCP_SERVERS_FILE = Path(__file__).resolve().parent.parent / \
    "workspace" / "config" / "mcp_servers.json"


@tool
def read_mcp_servers() -> str:
    """Read the MCP servers."""
    with open(MCP_SERVERS_FILE, "r") as f:
        return json.dumps(json.load(f), indent=4)


@tool
def update_mcp_server(mcp_server_id: str, new_or_updated_mcp_server: MCPServer) -> str:
    """Update the MCP servers: add a new MCP server or update an existing MCP server.

    Args:
        mcp_server_id: The ID of the MCP server to update or add. For a new MCP server, use a unique ID that does not exist in the current MCP servers.
        new_or_updated_mcp_server: The new or updated MCP server data.
    """
    with open(MCP_SERVERS_FILE, "r") as f:
        mcp_servers = json.load(f)

    action = "updated" if mcp_server_id in mcp_servers else "added"

    mcp_servers[mcp_server_id] = new_or_updated_mcp_server
    with open(MCP_SERVERS_FILE, "w") as f:
        json.dump(mcp_servers, f, indent=4)

    return f"MCP server '{mcp_server_id}' {action} successfully."


@tool
def delete_mcp_server(mcp_server_id: str) -> str:
    """Delete an MCP server.

    Args:
        mcp_server_id: The ID of the MCP server to delete.
    """
    with open(MCP_SERVERS_FILE, "r") as f:
        mcp_servers = json.load(f)

    if mcp_server_id in mcp_servers:
        del mcp_servers[mcp_server_id]
        with open(MCP_SERVERS_FILE, "w") as f:
            json.dump(mcp_servers, f, indent=4)
        return f"MCP server '{mcp_server_id}' deleted successfully."
    else:
        return f"MCP server '{mcp_server_id}' not found."


tools = [read_mcp_servers, update_mcp_server, delete_mcp_server]

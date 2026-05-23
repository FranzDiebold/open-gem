import json
from pathlib import Path
from typing import TypedDict

from langchain.tools import tool


class CronQuery(TypedDict):
    description: str
    schedule: str
    query: str


CRON_QUERIES_FILE = Path(__file__).resolve().parent.parent / \
    "workspace" / "config" / "cron_queries.json"
MEMORY_DIR = Path(__file__).resolve().parent.parent / "workspace" / "memory"


@tool
def list_cron_queries() -> str:
    """List all cron queries. Show as a markdown table."""
    with open(CRON_QUERIES_FILE, "r") as f:
        return json.dumps(json.load(f), indent=4)


@tool
def update_cron_query(cron_query_id: str, new_or_updated_cron_query: CronQuery) -> str:
    """Update the cron queries: add a new cron query or update an existing cron query.
    For a new cron query, if the user does not provide an ID, you can generate a unique ID by yourself.

    Args:
        cron_query_id: The ID of the cron query to update or add. For a new cron query, use a unique ID that does not exist in the current cron queries.
        new_or_updated_cron_query: The new or updated cron query data.
    """
    with open(CRON_QUERIES_FILE, "r") as f:
        cron_queries = json.load(f)

    action = "updated" if cron_query_id in cron_queries else "added"

    cron_queries[cron_query_id] = new_or_updated_cron_query
    with open(CRON_QUERIES_FILE, "w") as f:
        json.dump(cron_queries, f, indent=4)

    return f"Cron query '{cron_query_id}' {action} successfully."


@tool
def delete_cron_query(cron_query_id: str) -> str:
    """Delete a cron query.

    Args:
        cron_query_id: The ID of the cron query to delete.
    """
    with open(CRON_QUERIES_FILE, "r") as f:
        cron_queries = json.load(f)

    if cron_query_id in cron_queries:
        del cron_queries[cron_query_id]
        with open(CRON_QUERIES_FILE, "w") as f:
            json.dump(cron_queries, f, indent=4)
        return f"Cron query '{cron_query_id}' deleted successfully."
    else:
        return f"Cron query '{cron_query_id}' not found."


@tool
def read_cron_query_memory(cron_query_id: str) -> str:
    """
    Read the memory associated with a specific cron query.

    Args:
        cron_query_id: The ID of the cron query to read memory for.
    """
    filename = f"{cron_query_id}.md"
    filepath = MEMORY_DIR / "cron_queries" / filename

    if filepath.exists():
        return filepath.read_text()
    return ""


@tool
def write_cron_query_memory(cron_query_id: str, content: str) -> str:
    """
    Write or append to the memory file for a specific cron query.

    Args:
        cron_query_id: The ID of the cron query to write memory for.
        content: The content to write to the memory file.
    """
    cron_memory_dir = MEMORY_DIR / "cron_queries"
    cron_memory_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{cron_query_id}.md"
    filepath = cron_memory_dir / filename

    filepath.write_text(content)
    return f"Memory for cron query '{cron_query_id}' saved to {filename}"


tools = [list_cron_queries, update_cron_query,
         delete_cron_query, read_cron_query_memory, write_cron_query_memory]

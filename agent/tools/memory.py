from datetime import date
from pathlib import Path

from langchain.tools import tool

MEMORY_DIR = Path(__file__).resolve().parent.parent / "workspace" / "memory"


@tool
def read_daily_memory(target_date: date = None) -> str:
    """
    Read the memory for a given date.

    Args:
        target_date: The date to read memory for. Defaults to today.
    """
    if target_date is None:
        target_date = date.today()

    filename = f"memory_{target_date.strftime('%Y_%m_%d')}.md"
    filepath = MEMORY_DIR / filename

    if filepath.exists():
        return filepath.read_text()
    return ""


@tool
def write_daily_memory(content: str, target_date: date = None) -> str:
    """
    Write or append to the memory file for a given date.

    Args:
        content: The content to write to the memory file.
        target_date: The date to write memory for. Defaults to today.
    """
    if target_date is None:
        target_date = date.today()

    filename = f"memory_{target_date.strftime('%Y_%m_%d')}.md"
    filepath = MEMORY_DIR / filename

    filepath.write_text(content)
    return f"Memory saved to {filename}"


tools = [read_daily_memory, write_daily_memory]

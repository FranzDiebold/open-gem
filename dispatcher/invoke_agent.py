import argparse
import asyncio
import os
import sys

from langgraph_sdk import get_client

parser = argparse.ArgumentParser(
    description="Send a message to the LangGraph agent and stream the response"
)
parser.add_argument(
    "cron_query_id",
    type=str,
    help="The ID of the cron query to invoke"
)
parser.add_argument(
    "message",
    type=str,
    help="The message to send to the agent"
)

args = parser.parse_args()


async def invoke_agent(cron_query_id: str, message: str) -> None:
    api_url = os.getenv("LANGGRAPH_API_URL")
    assistant_id = os.getenv("LANGGRAPH_ASSISTANT_ID")

    if not api_url:
        print("Error: LANGGRAPH_API_URL environment variable not set", file=sys.stderr)
        sys.exit(1)

    if not assistant_id:
        print("Error: LANGGRAPH_ASSISTANT_ID environment variable not set",
              file=sys.stderr)
        sys.exit(1)

    client = get_client(url=api_url)
    title = message[:47] + "..." if len(message) > 50 else message
    thread = await client.threads.create(metadata={"title": title, "channel": "cron"})

    input = {
        "messages": [
            {
                "role": "system",
                "content": (
                    f"First use the `read_cron_query_memory` tool (`cron_query_id`='{cron_query_id}') to read any relevant memory for this cron query.\n"
                    f"After you finished your tasks, use the `write_cron_query_memory` tool (`cron_query_id`='{cron_query_id}') to write any relevant information to the memory for the next run of this cron query.\n"
                ),
            },
            {
                "role": "human",
                "content": message
            },
        ]
    }
    async for chunk in client.runs.stream(thread['thread_id'], assistant_id, input=input):
        print(chunk)


asyncio.run(invoke_agent(args.cron_query_id, args.message))

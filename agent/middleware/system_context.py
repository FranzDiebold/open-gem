from datetime import datetime, timezone
from pathlib import Path
from typing import Awaitable, Callable

from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from langchain.messages import SystemMessage

AGENT_PATH = Path(__file__).resolve().parent.parent / "workspace" / "agent"

AGENT_FILES = ["PERSONA.md", "LEARNINGS.md"]


def _load_agent_files() -> list[str]:
    contents = []
    for filename in AGENT_FILES:
        try:
            text = (AGENT_PATH / filename).read_text(encoding="utf-8").strip()
            if text:
                contents.append(text)
        except FileNotFoundError:
            continue
    return contents


def _build_context_block() -> str:
    parts = []

    now = datetime.now()
    utc_now = datetime.now(timezone.utc)
    tz_name = now.astimezone().tzname() or "UTC"
    utc_offset = now.astimezone().strftime("%z")
    # Format offset as ±HH:MM
    if len(utc_offset) == 5:
        utc_offset = utc_offset[:3] + ":" + utc_offset[3:]
    parts.append(
        f"- Current date and time: {now.strftime('%Y-%m-%d %H:%M:%S')} ({tz_name}, UTC{utc_offset})"
    )
    parts.append(f"- UTC time: {utc_now.strftime('%Y-%m-%d %H:%M:%S')}")

    return "\n\n## Context\n\n" + "\n".join(parts)


class SystemContextMiddleware(AgentMiddleware):
    def _inject_context(self, request: ModelRequest) -> ModelRequest:
        agent_texts = _load_agent_files()
        context = _build_context_block()
        existing_content = list(
            request.system_message.content_blocks) if request.system_message else []
        new_content = [{"type": "text", "text": text} for text in agent_texts]
        new_content += existing_content
        new_content.append({"type": "text", "text": context})
        return request.override(
            system_message=SystemMessage(content=new_content)
        )

    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        return handler(self._inject_context(request))

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        return await handler(self._inject_context(request))

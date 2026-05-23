from pathlib import Path
from typing import Awaitable, Callable, TypedDict

from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from langchain.messages import SystemMessage
from langchain.tools import tool


class Skill(TypedDict):
    name: str
    description: str
    content: str


SKILLS_PATH = Path(__file__).resolve().parent.parent / "workspace" / "skills"


def _parse_skills_file(text: str, skill_name: str) -> Skill:
    stripped = text.lstrip()
    if not stripped.startswith("---"):
        return {
            "name": skill_name,
            "description": "No description provided.",
            "content": text.strip(),
        }

    lines = stripped.splitlines()
    if not lines or lines[0].strip() != "---":
        return {
            "name": skill_name,
            "description": "No description provided.",
            "content": text.strip(),
        }

    frontmatter: dict[str, str] = {}
    end_index = None

    for idx, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = idx
            break
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip('"').strip("'")

    if end_index is None:
        return {
            "name": skill_name,
            "description": "No description provided.",
            "content": text.strip(),
        }

    body = "\n".join(lines[end_index + 1:]).strip()
    return {
        "name": skill_name,
        "description": frontmatter.get("description", "No description provided."),
        "content": body,
    }


def _load_skills() -> list[Skill]:
    skills: list[Skill] = []

    if not SKILLS_PATH.exists():
        return skills

    for skill_file in sorted(SKILLS_PATH.glob("*.md")):
        raw_content = skill_file.read_text(encoding="utf-8")
        skills.append(_parse_skills_file(
            raw_content, skill_name=skill_file.stem))

    return skills


SKILLS = _load_skills()


@tool
def list_skills() -> str:
    """List all available skills with their names and descriptions."""
    if not SKILLS:
        return "No skills are currently available."

    lines = []
    for skill in SKILLS:
        lines.append(f"- **{skill['name']}**: {skill['description']}")
    return "Available skills:\n" + "\n".join(lines) + "\nAnswer in table format."


@tool
def load_skill(skill_name: str) -> str:
    """Load the full content of a skill into the agent's context.

    Use this when you need detailed information about how to handle a specific
    type of request. This will provide you with comprehensive instructions,
    policies, and guidelines for the skill area.

    Args:
        skill_name: The name of the skill to load (e.g., "expense_reporting", "travel_booking")
    """
    for skill in SKILLS:
        if skill["name"] == skill_name:
            return f"Loaded skill: {skill_name}\n\n{skill['content']}"

    # Skill not found
    available = ", ".join(s["name"] for s in SKILLS)
    return f"Skill '{skill_name}' not found. Available skills: {available}"


@tool
def upsert_skill(skill_name: str, description: str, content: str) -> str:
    """Create a new skill or update an existing one.

    This writes a skill markdown file with frontmatter and content to the
    skills directory.

    Args:
        skill_name: The name of the skill (used as the filename, e.g., "travel_booking")
        description: A short description of when this skill should be used
        content: The full markdown content with instructions for the skill
    """
    global SKILLS

    SKILLS_PATH.mkdir(parents=True, exist_ok=True)

    file_content = f"---\ndescription: {description}\n---\n\n{content}\n"
    skill_file = SKILLS_PATH / f"{skill_name}.md"
    skill_file.write_text(file_content, encoding="utf-8")

    # Update the in-memory skills list
    new_skill: Skill = {
        "name": skill_name,
        "description": description,
        "content": content,
    }
    for i, skill in enumerate(SKILLS):
        if skill["name"] == skill_name:
            SKILLS[i] = new_skill
            return f"Skill '{skill_name}' updated successfully."

    SKILLS.append(new_skill)
    return f"Skill '{skill_name}' created successfully."


class SkillMiddleware(AgentMiddleware):
    """Middleware that injects skill descriptions into the system prompt."""

    tools = [list_skills, load_skill, upsert_skill]

    def __init__(self):
        if SKILLS:
            skills_list = []
            for skill in SKILLS:
                skills_list.append(
                    f"- **{skill['name']}**: {skill['description']}")
            self.skills_prompt = "\n".join(skills_list)
        else:
            self.skills_prompt = "- No skills found in the skills directory."

    def _inject_skills_into_request(self, request: ModelRequest) -> ModelRequest:
        skills_addendum = (
            f"\n\n## Available Skills\n\n{self.skills_prompt}\n\n"
            "Use the `load_skill` tool when you need detailed information "
            "about handling a specific type of request."
        )

        new_content = list(request.system_message.content_blocks) + [
            {"type": "text", "text": skills_addendum}
        ]
        new_system_message = SystemMessage(content=new_content)
        return request.override(system_message=new_system_message)

    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        return handler(self._inject_skills_into_request(request))

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        return await handler(self._inject_skills_into_request(request))

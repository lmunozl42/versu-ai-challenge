from uuid import UUID

from app.entities.prompt import Prompt
from app.interfaces.prompt_repository import IPromptRepository


class UpdatePromptUseCase:
    def __init__(self, repo: IPromptRepository):
        self._repo = repo

    async def execute(self, prompt_id: UUID, org_id: UUID, name: str | None, content: str | None) -> Prompt:
        return await self._repo.update(prompt_id, org_id, name, content)

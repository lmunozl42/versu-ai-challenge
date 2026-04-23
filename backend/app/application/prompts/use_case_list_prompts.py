from uuid import UUID

from app.entities.prompt import Prompt
from app.interfaces.prompt_repository import IPromptRepository


class ListPromptsUseCase:
    def __init__(self, repo: IPromptRepository):
        self._repo = repo

    async def execute(self, org_id: UUID) -> list[Prompt]:
        return await self._repo.list_active_by_org(org_id)

from uuid import UUID

from app.entities.prompt import Prompt
from app.interfaces.prompt_repository import IPromptRepository


class SetDefaultPromptUseCase:
    def __init__(self, repo: IPromptRepository):
        self._repo = repo

    async def execute(self, prompt_id: UUID, org_id: UUID) -> Prompt:
        prompt = await self._repo.get_by_id(prompt_id, org_id)
        if not prompt:
            raise ValueError("Prompt not found")
        return await self._repo.set_default(prompt_id, org_id)

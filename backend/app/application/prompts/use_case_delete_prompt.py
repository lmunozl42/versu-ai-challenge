from uuid import UUID

from app.interfaces.prompt_repository import IPromptRepository


class DeletePromptUseCase:
    def __init__(self, repo: IPromptRepository):
        self._repo = repo

    async def execute(self, prompt_id: UUID, org_id: UUID) -> None:
        await self._repo.delete(prompt_id, org_id)

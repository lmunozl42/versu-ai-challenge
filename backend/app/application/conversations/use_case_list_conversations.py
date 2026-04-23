from uuid import UUID

from app.entities.conversation import Conversation
from app.interfaces.conversation_repository import IConversationRepository


class ListConversationsUseCase:
    def __init__(self, repo: IConversationRepository):
        self._repo = repo

    async def execute(self, org_id: UUID) -> list[Conversation]:
        return await self._repo.list_by_org(org_id)

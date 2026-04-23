from uuid import UUID

from app.entities.conversation import Conversation
from app.interfaces.conversation_repository import IConversationRepository


class CreateConversationUseCase:
    def __init__(self, repo: IConversationRepository):
        self._repo = repo

    async def execute(self, org_id: UUID, channel: str) -> Conversation:
        return await self._repo.create(org_id, channel)

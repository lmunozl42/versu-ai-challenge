from uuid import UUID

from app.entities.conversation import Conversation
from app.interfaces.conversation_repository import IConversationRepository


class GetConversationUseCase:
    def __init__(self, repo: IConversationRepository):
        self._repo = repo

    async def execute(self, conversation_id: UUID, org_id: UUID) -> Conversation:
        conv = await self._repo.get_by_id(conversation_id, org_id)
        if not conv:
            raise ValueError("Conversation not found")
        return conv

from uuid import UUID

from app.entities.conversation import Conversation
from app.interfaces.conversation_repository import IConversationRepository


class RateConversationUseCase:
    def __init__(self, repo: IConversationRepository):
        self._repo = repo

    async def execute(self, conversation_id: UUID, org_id: UUID, rating: int) -> Conversation:
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")
        conv = await self._repo.get_by_id(conversation_id, org_id)
        if not conv:
            raise ValueError("Conversation not found")
        return await self._repo.rate(conversation_id, org_id, rating)

from abc import ABC, abstractmethod
from uuid import UUID

from app.entities.conversation import Conversation, Message


class IConversationRepository(ABC):
    @abstractmethod
    async def create(self, org_id: UUID, channel: str) -> Conversation: ...

    @abstractmethod
    async def list_by_org(self, org_id: UUID) -> list[Conversation]: ...

    @abstractmethod
    async def get_by_id(self, conversation_id: UUID, org_id: UUID) -> Conversation | None: ...

    @abstractmethod
    async def close(self, conversation_id: UUID, org_id: UUID) -> Conversation: ...

    @abstractmethod
    async def rate(self, conversation_id: UUID, org_id: UUID, rating: int) -> Conversation: ...

    @abstractmethod
    async def add_message(
        self,
        conversation_id: UUID,
        org_id: UUID,
        role: str,
        content: str,
        response_time_ms: int | None = None,
        prompt_used: str | None = None,
    ) -> Message: ...

    @abstractmethod
    async def get_recent_messages(self, conversation_id: UUID, org_id: UUID, limit: int = 10) -> list[Message]: ...

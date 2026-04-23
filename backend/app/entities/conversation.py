from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Message:
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    created_at: datetime
    response_time_ms: int | None = None
    prompt_used: str | None = None


@dataclass
class Conversation:
    id: UUID
    org_id: UUID
    status: str
    channel: str
    created_at: datetime
    rating: int | None = None
    closed_at: datetime | None = None
    messages: list[Message] = field(default_factory=list)
    message_count: int = 0

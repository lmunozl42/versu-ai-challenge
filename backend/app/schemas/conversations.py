import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    channel: str = "web"


class MessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    response_time_ms: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    status: str
    channel: str
    rating: Optional[int] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    message_count: int = 0

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationOut):
    messages: list[MessageOut] = []


class RateConversation(BaseModel):
    rating: int  # 1-5

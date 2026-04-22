import uuid
from datetime import datetime

from pydantic import BaseModel


class PromptOut(BaseModel):
    id: uuid.UUID
    name: str
    content: str
    is_default: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

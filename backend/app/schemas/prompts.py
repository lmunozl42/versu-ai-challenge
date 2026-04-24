import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class PromptOut(BaseModel):
    id: uuid.UUID
    name: str
    content: str
    is_default: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PromptCreate(BaseModel):
    name: str
    content: str

    @field_validator("name", "content")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class PromptUpdate(BaseModel):
    name: str | None = None
    content: str | None = None

    @field_validator("name", "content", mode="before")
    @classmethod
    def not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip() if v else v

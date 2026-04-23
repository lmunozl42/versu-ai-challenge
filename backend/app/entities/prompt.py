from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Prompt:
    id: UUID
    org_id: UUID
    name: str
    content: str
    is_default: bool
    is_active: bool
    created_at: datetime

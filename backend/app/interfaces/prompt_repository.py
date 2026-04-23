from abc import ABC, abstractmethod
from uuid import UUID

from app.entities.prompt import Prompt


class IPromptRepository(ABC):
    @abstractmethod
    async def list_active_by_org(self, org_id: UUID) -> list[Prompt]: ...

    @abstractmethod
    async def get_default_by_org(self, org_id: UUID) -> Prompt | None: ...

    @abstractmethod
    async def get_by_id(self, prompt_id: UUID, org_id: UUID) -> Prompt | None: ...

    @abstractmethod
    async def set_default(self, prompt_id: UUID, org_id: UUID) -> Prompt: ...

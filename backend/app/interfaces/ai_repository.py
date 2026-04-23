from abc import ABC, abstractmethod
from typing import AsyncIterator


class IAIClient(ABC):
    @abstractmethod
    async def stream_response(self, messages: list[dict]) -> AsyncIterator[str]: ...

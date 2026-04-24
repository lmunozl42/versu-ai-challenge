from abc import ABC, abstractmethod
from typing import AsyncIterator


class IAIClient(ABC):
    @abstractmethod
    def stream_response(self, messages: list[dict]) -> AsyncIterator[str]: ...

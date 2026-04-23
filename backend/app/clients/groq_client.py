from typing import AsyncIterator

from groq import AsyncGroq

from app.core.config import settings
from app.core.metrics import ai_api_duration
from app.interfaces.ai_repository import IAIClient


class GroqAIClient(IAIClient):
    def __init__(self):
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def stream_response(self, messages: list[dict]) -> AsyncIterator[str]:
        import time

        start = time.monotonic()
        stream = await self._client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            stream=True,
            max_tokens=512,
        )
        async for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield token
        ai_api_duration.observe(time.monotonic() - start)

import time
from typing import Awaitable, Callable
from uuid import UUID

from app.interfaces.ai_repository import IAIClient
from app.interfaces.conversation_repository import IConversationRepository
from app.interfaces.prompt_repository import IPromptRepository

_FALLBACK_PROMPT = "Eres un asistente útil."


class StreamAIResponseUseCase:
    def __init__(
        self,
        conversation_repo: IConversationRepository,
        prompt_repo: IPromptRepository,
        ai_client: IAIClient,
    ):
        self._conv_repo = conversation_repo
        self._prompt_repo = prompt_repo
        self._ai_client = ai_client

    async def execute(
        self,
        conversation_id: UUID,
        org_id: UUID,
        user_content: str,
        on_token: Callable[[str], Awaitable[None]],
    ) -> str:
        await self._conv_repo.add_message(conversation_id, "user", user_content)

        history = await self._conv_repo.get_recent_messages(conversation_id, limit=10)
        default_prompt = await self._prompt_repo.get_default_by_org(org_id)
        system_prompt = default_prompt.content if default_prompt else _FALLBACK_PROMPT

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({
                "role": "user" if msg.role == "user" else "assistant",
                "content": msg.content,
            })

        full_response = ""
        start_ts = time.monotonic()

        try:
            async for token in self._ai_client.stream_response(messages):
                full_response += token
                await on_token(token)
        except Exception as e:
            detail = str(e).strip().replace("\n", " ")[:180]
            full_response = (
                f"Lo siento, ocurrió un error al procesar tu mensaje. "
                f"({type(e).__name__}: {detail})"
            )
            await on_token(full_response)

        response_time_ms = int((time.monotonic() - start_ts) * 1000)

        ai_msg = await self._conv_repo.add_message(
            conversation_id,
            "ai",
            full_response,
            response_time_ms=response_time_ms,
            prompt_used=system_prompt,
        )
        return str(ai_msg.id)

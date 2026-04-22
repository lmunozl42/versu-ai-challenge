import json
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import decode_token
from app.db.models import Conversation, Message, Prompt
from app.db.session import AsyncSessionLocal

router = APIRouter(tags=["websocket"])

# org_id -> set of WebSocket connections (for real-time broadcast)
_org_connections: dict[str, set[WebSocket]] = {}


def _register(org_id: str, ws: WebSocket):
    _org_connections.setdefault(org_id, set()).add(ws)


def _unregister(org_id: str, ws: WebSocket):
    _org_connections.get(org_id, set()).discard(ws)


async def _broadcast_new_conversation(org_id: str, payload: dict):
    dead = set()
    for ws in list(_org_connections.get(org_id, set())):
        try:
            await ws.send_text(json.dumps({"type": "new_conversation", **payload}))
        except Exception:
            dead.add(ws)
    for ws in dead:
        _unregister(org_id, ws)


@router.websocket("/ws/conversations/{conversation_id}")
async def conversation_ws(websocket: WebSocket, conversation_id: uuid.UUID, token: str):
    await websocket.accept()

    # --- Auth ---
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    org_id = payload.get("org_id")
    if not org_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    async with AsyncSessionLocal() as session:
        # verify conversation belongs to org
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.org_id == org_id,
            )
            .options(selectinload(Conversation.messages))
        )
        conv = result.scalars().first()
        if not conv:
            await websocket.close(code=4004, reason="Conversation not found")
            return

        if conv.status == "closed":
            await websocket.close(code=4003, reason="Conversation is closed")
            return

        # get default prompt for org
        prompt_result = await session.execute(
            select(Prompt).where(
                Prompt.org_id == org_id,
                Prompt.is_default == True,
                Prompt.is_active == True,
            )
        )
        default_prompt = prompt_result.scalars().first()
        system_prompt = default_prompt.content if default_prompt else "Eres un asistente útil."

    _register(org_id, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") != "message":
                continue

            user_content = data.get("content", "").strip()
            if not user_content:
                continue

            now = datetime.now(timezone.utc)

            # save user message
            async with AsyncSessionLocal() as session:
                user_msg = Message(
                    id=uuid.uuid4(),
                    conversation_id=conversation_id,
                    role="user",
                    content=user_content,
                    created_at=now,
                )
                session.add(user_msg)
                await session.commit()

            # stream from Groq
            full_response = ""
            start_ts = time.monotonic()

            try:
                from groq import AsyncGroq
                from app.core.config import settings

                client = AsyncGroq(api_key=settings.GROQ_API_KEY)

                # build message history (last 10 messages for context)
                async with AsyncSessionLocal() as session:
                    history_result = await session.execute(
                        select(Message)
                        .where(Message.conversation_id == conversation_id)
                        .order_by(Message.created_at.desc())
                        .limit(10)
                    )
                    history = list(reversed(history_result.scalars().all()))

                messages_for_groq = [{"role": "system", "content": system_prompt}]
                for msg in history:
                    messages_for_groq.append({
                        "role": "user" if msg.role == "user" else "assistant",
                        "content": msg.content,
                    })

                stream = await client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=messages_for_groq,
                    stream=True,
                    max_tokens=512,
                )

                async for chunk in stream:
                    token = chunk.choices[0].delta.content or ""
                    if token:
                        full_response += token
                        await websocket.send_text(
                            json.dumps({"type": "token", "content": token})
                        )

            except Exception as e:
                # Keep a concise error for the user while still exposing enough detail
                # to debug provider/auth/network issues during development.
                detail = str(e).strip().replace("\n", " ")
                if len(detail) > 180:
                    detail = detail[:180] + "..."
                full_response = (
                    "Lo siento, ocurrió un error al procesar tu mensaje. "
                    f"({type(e).__name__}: {detail})"
                )
                await websocket.send_text(
                    json.dumps({"type": "token", "content": full_response})
                )

            response_time_ms = int((time.monotonic() - start_ts) * 1000)

            # save AI message
            async with AsyncSessionLocal() as session:
                ai_msg_id = uuid.uuid4()
                ai_msg = Message(
                    id=ai_msg_id,
                    conversation_id=conversation_id,
                    role="ai",
                    content=full_response,
                    response_time_ms=response_time_ms,
                    prompt_used=system_prompt,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(ai_msg)
                await session.commit()

            await websocket.send_text(
                json.dumps({"type": "done", "message_id": str(ai_msg_id)})
            )

    except WebSocketDisconnect:
        pass
    finally:
        _unregister(org_id, websocket)

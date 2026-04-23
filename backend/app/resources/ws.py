import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.metrics import ws_active_connections
from app.core.security import decode_token
from app.infrastructure.session import AsyncSessionLocal
from app.clients.groq_client import GroqAIClient
from app.repositories.conversation_repository import SQLConversationRepository
from app.repositories.prompt_repository import SQLPromptRepository
from app.application.chat.use_case_stream_ai_response import StreamAIResponseUseCase

router = APIRouter(tags=["websocket"])

_org_connections: dict[str, set[WebSocket]] = {}


def _register(org_id: str, ws: WebSocket) -> None:
    _org_connections.setdefault(org_id, set()).add(ws)
    ws_active_connections.inc()


def _unregister(org_id: str, ws: WebSocket) -> None:
    _org_connections.get(org_id, set()).discard(ws)
    ws_active_connections.dec()


async def broadcast_new_conversation(org_id: str, payload: dict) -> None:
    dead: set[WebSocket] = set()
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

    payload = decode_token(token)
    org_id = payload.get("org_id") if payload else None
    if not org_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    async with AsyncSessionLocal() as session:
        conv_repo = SQLConversationRepository(session)
        conv = await conv_repo.get_by_id(conversation_id, uuid.UUID(org_id))
        if not conv:
            await websocket.close(code=4004, reason="Conversation not found")
            return
        if conv.status == "closed":
            await websocket.close(code=4003, reason="Conversation is closed")
            return

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

            async def on_token(token: str) -> None:
                await websocket.send_text(json.dumps({"type": "token", "content": token}))

            async with AsyncSessionLocal() as session:
                use_case = StreamAIResponseUseCase(
                    conversation_repo=SQLConversationRepository(session),
                    prompt_repo=SQLPromptRepository(session),
                    ai_client=GroqAIClient(),
                )
                ai_message_id = await use_case.execute(
                    conversation_id=conversation_id,
                    org_id=uuid.UUID(org_id),
                    user_content=user_content,
                    on_token=on_token,
                )

            await websocket.send_text(json.dumps({"type": "done", "message_id": ai_message_id}))

    except WebSocketDisconnect:
        pass
    finally:
        _unregister(org_id, websocket)

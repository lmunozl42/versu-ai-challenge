import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.resources.ws import broadcast_new_conversation
from app.core.deps import get_current_user
from app.infrastructure.session import get_session
from app.entities.user import User
from app.repositories.conversation_repository import SQLConversationRepository
from app.schemas.conversations import (
    ConversationCreate,
    ConversationDetail,
    ConversationOut,
    RateConversation,
)
from app.application.conversations.use_case_close_conversation import CloseConversationUseCase
from app.application.conversations.use_case_create_conversation import CreateConversationUseCase
from app.application.conversations.use_case_get_conversation import GetConversationUseCase
from app.application.conversations.use_case_list_conversations import ListConversationsUseCase
from app.application.conversations.use_case_rate_conversation import RateConversationUseCase

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _repo(session: AsyncSession) -> SQLConversationRepository:
    return SQLConversationRepository(session)


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    conversations = await ListConversationsUseCase(_repo(session)).execute(current_user.org_id)
    return [ConversationOut.model_validate(c) for c in conversations]


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    conv = await CreateConversationUseCase(_repo(session)).execute(current_user.org_id, body.channel)
    await broadcast_new_conversation(
        str(current_user.org_id),
        {"id": str(conv.id), "channel": conv.channel, "status": conv.status},
    )
    return ConversationOut.model_validate(conv)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        conv = await GetConversationUseCase(_repo(session)).execute(conversation_id, current_user.org_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetail.model_validate(conv)


@router.patch("/{conversation_id}/close", response_model=ConversationOut)
async def close_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        conv = await CloseConversationUseCase(_repo(session)).execute(conversation_id, current_user.org_id)
    except ValueError as e:
        code = 400 if "already closed" in str(e) else 404
        raise HTTPException(status_code=code, detail=str(e))
    return ConversationOut.model_validate(conv)


@router.patch("/{conversation_id}/rate", response_model=ConversationOut)
async def rate_conversation(
    conversation_id: uuid.UUID,
    body: RateConversation,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        conv = await RateConversationUseCase(_repo(session)).execute(
            conversation_id, current_user.org_id, body.rating
        )
    except ValueError as e:
        code = 400 if "Rating" in str(e) else 404
        raise HTTPException(status_code=code, detail=str(e))
    return ConversationOut.model_validate(conv)

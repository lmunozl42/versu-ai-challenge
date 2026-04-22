import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.db.models import Conversation, Message, User
from app.db.session import get_session
from app.schemas.conversations import (
    ConversationCreate,
    ConversationDetail,
    ConversationOut,
    RateConversation,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Conversation)
        .where(Conversation.org_id == current_user.org_id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()

    # get message counts in one query
    counts_result = await session.execute(
        select(Message.conversation_id, func.count(Message.id).label("cnt"))
        .where(Message.conversation_id.in_([c.id for c in conversations]))
        .group_by(Message.conversation_id)
    )
    counts = {row.conversation_id: row.cnt for row in counts_result}

    out = []
    for c in conversations:
        data = ConversationOut.model_validate(c)
        data.message_count = counts.get(c.id, 0)
        out.append(data)
    return out


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    conv = Conversation(
        id=uuid.uuid4(),
        org_id=current_user.org_id,
        status="open",
        channel=body.channel,
        created_at=datetime.now(timezone.utc),
    )
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return ConversationOut.model_validate(conv)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.org_id == current_user.org_id,
        )
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    data = ConversationDetail.model_validate(conv)
    data.messages = sorted(conv.messages, key=lambda m: m.created_at)
    data.message_count = len(conv.messages)
    return data


@router.patch("/{conversation_id}/close", response_model=ConversationOut)
async def close_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.org_id == current_user.org_id,
        )
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.status == "closed":
        raise HTTPException(status_code=400, detail="Conversation already closed")

    conv.status = "closed"
    conv.closed_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(conv)
    return ConversationOut.model_validate(conv)


@router.patch("/{conversation_id}/rate", response_model=ConversationOut)
async def rate_conversation(
    conversation_id: uuid.UUID,
    body: RateConversation,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    result = await session.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.org_id == current_user.org_id,
        )
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.rating = body.rating
    await session.commit()
    await session.refresh(conv)
    return ConversationOut.model_validate(conv)

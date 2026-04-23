import uuid
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.models import Conversation as ConversationORM
from app.infrastructure.models import Message as MessageORM
from app.entities.conversation import Conversation, Message
from app.interfaces.conversation_repository import IConversationRepository


def _map_message(orm: MessageORM) -> Message:
    return Message(
        id=orm.id,
        conversation_id=orm.conversation_id,
        role=orm.role,
        content=orm.content,
        created_at=orm.created_at,
        response_time_ms=orm.response_time_ms,
        prompt_used=orm.prompt_used,
    )


def _map_conversation(
    orm: ConversationORM,
    messages: list[MessageORM] | None = None,
    message_count: int = 0,
) -> Conversation:
    return Conversation(
        id=orm.id,
        org_id=orm.org_id,
        status=orm.status,
        channel=orm.channel,
        created_at=orm.created_at,
        rating=orm.rating,
        closed_at=orm.closed_at,
        messages=[_map_message(m) for m in (messages or [])],
        message_count=message_count,
    )


class SQLConversationRepository(IConversationRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, org_id: UUID, channel: str) -> Conversation:
        conv = ConversationORM(
            id=uuid.uuid4(),
            org_id=org_id,
            status="open",
            channel=channel,
            created_at=datetime.now(timezone.utc),
        )
        self._session.add(conv)
        await self._session.commit()
        await self._session.refresh(conv)
        return _map_conversation(conv)

    async def list_by_org(self, org_id: UUID) -> list[Conversation]:
        result = await self._session.execute(
            select(ConversationORM)
            .where(ConversationORM.org_id == org_id)
            .order_by(ConversationORM.created_at.desc())
        )
        conversations = result.scalars().all()

        counts_result = await self._session.execute(
            select(MessageORM.conversation_id, func.count(MessageORM.id).label("cnt"))
            .where(MessageORM.conversation_id.in_([c.id for c in conversations]))
            .group_by(MessageORM.conversation_id)
        )
        counts = {row.conversation_id: row.cnt for row in counts_result}

        return [_map_conversation(c, message_count=counts.get(c.id, 0)) for c in conversations]

    async def get_by_id(self, conversation_id: UUID, org_id: UUID) -> Conversation | None:
        result = await self._session.execute(
            select(ConversationORM)
            .where(
                ConversationORM.id == conversation_id,
                ConversationORM.org_id == org_id,
            )
            .options(selectinload(ConversationORM.messages))
        )
        conv = result.scalars().first()
        if not conv:
            return None
        sorted_msgs = sorted(conv.messages, key=lambda m: m.created_at)
        return _map_conversation(conv, messages=sorted_msgs, message_count=len(conv.messages))

    async def close(self, conversation_id: UUID, org_id: UUID) -> Conversation:
        result = await self._session.execute(
            select(ConversationORM).where(
                ConversationORM.id == conversation_id,
                ConversationORM.org_id == org_id,
            )
        )
        conv = result.scalars().first()
        conv.status = "closed"
        conv.closed_at = datetime.now(timezone.utc)
        await self._session.commit()
        await self._session.refresh(conv)
        return _map_conversation(conv)

    async def rate(self, conversation_id: UUID, org_id: UUID, rating: int) -> Conversation:
        result = await self._session.execute(
            select(ConversationORM).where(
                ConversationORM.id == conversation_id,
                ConversationORM.org_id == org_id,
            )
        )
        conv = result.scalars().first()
        conv.rating = rating
        await self._session.commit()
        await self._session.refresh(conv)
        return _map_conversation(conv)

    async def add_message(
        self,
        conversation_id: UUID,
        role: str,
        content: str,
        response_time_ms: int | None = None,
        prompt_used: str | None = None,
    ) -> Message:
        msg = MessageORM(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            role=role,
            content=content,
            response_time_ms=response_time_ms,
            prompt_used=prompt_used,
            created_at=datetime.now(timezone.utc),
        )
        self._session.add(msg)
        await self._session.commit()
        await self._session.refresh(msg)
        return _map_message(msg)

    async def get_recent_messages(self, conversation_id: UUID, limit: int = 10) -> list[Message]:
        result = await self._session.execute(
            select(MessageORM)
            .where(MessageORM.conversation_id == conversation_id)
            .order_by(MessageORM.created_at.desc())
            .limit(limit)
        )
        return [_map_message(m) for m in reversed(result.scalars().all())]

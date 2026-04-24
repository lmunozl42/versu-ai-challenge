import uuid as _uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models import Prompt as PromptORM
from app.entities.prompt import Prompt
from app.interfaces.prompt_repository import IPromptRepository


def _map_prompt(orm: PromptORM) -> Prompt:
    return Prompt(
        id=orm.id,
        org_id=orm.org_id,
        name=orm.name,
        content=orm.content,
        is_default=orm.is_default,
        is_active=orm.is_active,
        created_at=orm.created_at,
    )


class SQLPromptRepository(IPromptRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def list_active_by_org(self, org_id: UUID) -> list[Prompt]:
        result = await self._session.execute(
            select(PromptORM)
            .where(PromptORM.org_id == org_id, PromptORM.is_active)
            .order_by(PromptORM.created_at)
        )
        return [_map_prompt(p) for p in result.scalars().all()]

    async def get_default_by_org(self, org_id: UUID) -> Prompt | None:
        result = await self._session.execute(
            select(PromptORM).where(
                PromptORM.org_id == org_id,
                PromptORM.is_default,
                PromptORM.is_active,
            )
        )
        orm = result.scalars().first()
        return _map_prompt(orm) if orm else None

    async def get_by_id(self, prompt_id: UUID, org_id: UUID) -> Prompt | None:
        result = await self._session.execute(
            select(PromptORM).where(
                PromptORM.id == prompt_id,
                PromptORM.org_id == org_id,
                PromptORM.is_active,
            )
        )
        orm = result.scalars().first()
        return _map_prompt(orm) if orm else None

    async def set_default(self, prompt_id: UUID, org_id: UUID) -> Prompt:
        result = await self._session.execute(
            select(PromptORM).where(
                PromptORM.org_id == org_id,
                PromptORM.is_active,
            )
        )
        prompts = result.scalars().all()
        target = next((p for p in prompts if p.id == prompt_id), None)
        if not target:
            raise ValueError("Prompt not found")
        for p in prompts:
            p.is_default = p.id == prompt_id
        await self._session.commit()
        await self._session.refresh(target)
        return _map_prompt(target)

    async def create(self, org_id: UUID, name: str, content: str) -> Prompt:
        orm = PromptORM(
            id=_uuid.uuid4(),
            org_id=org_id,
            name=name,
            content=content,
            is_default=False,
            is_active=True,
        )
        self._session.add(orm)
        await self._session.commit()
        await self._session.refresh(orm)
        return _map_prompt(orm)

    async def update(self, prompt_id: UUID, org_id: UUID, name: str | None, content: str | None) -> Prompt:
        result = await self._session.execute(
            select(PromptORM).where(
                PromptORM.id == prompt_id,
                PromptORM.org_id == org_id,
                PromptORM.is_active,
            )
        )
        orm = result.scalars().first()
        if not orm:
            raise ValueError("Prompt not found")
        if name is not None:
            orm.name = name
        if content is not None:
            orm.content = content
        await self._session.commit()
        await self._session.refresh(orm)
        return _map_prompt(orm)

    async def delete(self, prompt_id: UUID, org_id: UUID) -> None:
        result = await self._session.execute(
            select(PromptORM).where(
                PromptORM.org_id == org_id,
                PromptORM.is_active,
            )
        )
        active = result.scalars().all()
        target = next((p for p in active if p.id == prompt_id), None)
        if not target:
            raise ValueError("Prompt not found")
        if target.is_default:
            raise ValueError("Cannot delete the default prompt")
        if len(active) <= 1:
            raise ValueError("Cannot delete the last prompt")
        target.is_active = False
        await self._session.commit()

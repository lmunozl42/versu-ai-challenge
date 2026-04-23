from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.models import User as UserORM
from app.entities.user import Organization, User
from app.interfaces.user_repository import IUserRepository


class SQLUserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, orm: UserORM) -> User:
        org = None
        if orm.organization:
            org = Organization(
                id=orm.organization.id,
                name=orm.organization.name,
                slug=orm.organization.slug,
            )
        return User(
            id=orm.id,
            email=orm.email,
            name=orm.name,
            org_id=orm.org_id,
            hashed_password=orm.hashed_password,
            organization=org,
        )

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserORM)
            .where(UserORM.email == email)
            .options(selectinload(UserORM.organization))
        )
        orm = result.scalars().first()
        return self._to_entity(orm) if orm else None

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self._session.execute(
            select(UserORM)
            .where(UserORM.id == user_id)
            .options(selectinload(UserORM.organization))
        )
        orm = result.scalars().first()
        return self._to_entity(orm) if orm else None

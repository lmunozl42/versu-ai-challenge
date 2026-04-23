from dataclasses import dataclass
from uuid import UUID


@dataclass
class Organization:
    id: UUID
    name: str
    slug: str


@dataclass
class User:
    id: UUID
    email: str
    name: str
    org_id: UUID
    hashed_password: str
    organization: Organization | None = None

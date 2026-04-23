# Day 1 — Morning: Scaffolding, Database & Auth

## Goal
By the end of this block: `docker compose up` runs Postgres + FastAPI, all tables exist
with multi-tenancy enforced, 2 seed orgs with users, and JWT auth is working and isolated by org_id.

---

## Block 1 — Scaffolding & Docker

- [x] Project folder structure
- [x] `requirements.txt` with base dependencies
- [x] `Dockerfile` for backend (Python 3.12-slim)
- [x] `docker-compose.yml`: db (Postgres 16) + backend + adminer
- [x] `.env.example` with all required variables
- [x] `app/core/config.py` — Pydantic Settings (uppercase field names)

---

## Block 2 — Database Models with Multi-Tenancy

**Tables:** organizations, users, conversations, messages, prompts — all with `org_id` for isolation.

- [x] `app/infrastructure/base.py` — SQLAlchemy DeclarativeBase + TimestampMixin
- [x] `app/infrastructure/models.py` — all ORM models
- [x] `app/infrastructure/session.py` — async engine + `get_session` + `AsyncSessionLocal`
- [x] Alembic init + `env.py` configured for async
- [x] Initial migration `0001_initial.py`

---

## Block 3 — Seed Data

- [x] 2 orgs: Acme Corp (admin@acme.com / acme123), Globex Inc (admin@globex.com / globex123)
- [x] 4 prompts per org (Amigable default, Formal, El Gringo, Experto Técnico)
- [x] 20 seed conversations per org with random channels/statuses/ratings/dates
- [x] `app/infrastructure/seed.py` — idempotent, called on FastAPI startup via `lifespan`

---

## Block 4 — JWT Authentication

- [x] `app/core/security.py` — hash_password, verify_password, create_access_token, decode_token
- [x] `app/schemas/auth.py` — LoginRequest, TokenResponse, UserOut, OrgOut
- [x] `POST /auth/login` and `GET /auth/me`
- [x] `app/core/deps.py` — `get_current_user` validates JWT, returns domain User entity
- [x] Router registered in `main.py`

---

## Status: ✅ Complete

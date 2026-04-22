# Plan Día 1 — Mañana: Scaffolding + DB + Auth

## Objetivo
Al terminar este bloque: docker-compose up levanta Postgres + FastAPI,
las tablas existen con multi-tenancy, hay 2 orgs con sus usuarios seed,
y el auth JWT funciona y está aislado por org_id.

---

## Bloque 1 — Scaffolding y Docker (~45 min)

**Estructura de carpetas:**
```
versu-ai-challenge/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── schemas/
│   ├── alembic/
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/       ← placeholder por ahora
├── docker-compose.yml
└── .env.example
```

**Tareas:**
- [x] Crear estructura de carpetas
- [x] requirements.txt con dependencias base
- [x] Dockerfile backend (Python 3.12-slim)
- [x] docker-compose.yml: db (Postgres 16) + backend + adminer
- [x] .env.example con todas las variables
- [x] app/core/config.py — Pydantic Settings

**Done cuando:** `docker-compose up` levanta sin errores, `/docs` responde.
**PENDIENTE:** Instalar Docker Desktop para verificar.

---

## Bloque 2 — Modelos de BD con multi-tenancy (~1h)

**Tablas:**

| Tabla | Columnas clave |
|-------|---------------|
| organizations | id (UUID), name, slug, created_at |
| users | id, email, hashed_password, name, org_id FK, created_at |
| conversations | id, org_id, status (open/closed), channel (web/whatsapp/instagram), rating (1-5 nullable), created_at, closed_at |
| messages | id, conversation_id, role (user/ai), content, response_time_ms, prompt_used, created_at |
| prompts | id, org_id, name, content, is_default, is_active, created_at |

**Regla de multi-tenancy:** org_id presente en todas las tablas de datos.
Un usuario solo puede ver registros donde org_id == su org_id (enforcement en deps.py).

**Tareas:**
- [x] app/db/base.py — Base declarativa + mixin con id UUID y created_at
- [x] app/db/models.py — todos los modelos SQLAlchemy
- [x] app/db/session.py — engine async + get_session dependency
- [x] alembic init + env.py configurado para async
- [x] Primera migración manual (0001_initial.py)

**Done cuando:** `alembic upgrade head` crea tablas sin errores.

---

## Bloque 3 — Seeds (~30 min)

**Datos:**
- Org A: "Acme Corp" (slug: acme) → admin@acme.com / acme123
- Org B: "Globex Inc" (slug: globex) → admin@globex.com / globex123

**Prompts hardcodeados (4 por org):**
1. "Asistente amigable y joven" (default)
2. "Profesional formal y conciso"
3. "Gringo que habla español con dificultad"
4. "Experto técnico muy detallista"

**Tareas:**
- [x] app/db/seed.py — upsert idempotente (safe para re-ejecutar)
- [x] Llamar seed en startup de FastAPI (lifespan)
- [ ] Verificar datos en Adminer (localhost:8080) — pendiente Docker

**Done cuando:** ambas orgs y sus datos existen aislados en la BD.

---

## Bloque 4 — Auth JWT (~1h 15min)

**Endpoints:**

| Método | Ruta | Body/Response |
|--------|------|--------------|
| POST | /auth/login | {email, password} → {access_token, token_type} |
| GET | /auth/me | Header: Bearer token → {user, org} |

**JWT payload:**
```json
{ "sub": "user_uuid", "org_id": "org_uuid", "email": "user@org.com", "exp": timestamp }
```

**Tareas:**
- [x] app/core/security.py — hash_password, verify_password, create_token, decode_token
- [x] app/schemas/auth.py — LoginRequest, TokenResponse, UserOut
- [x] app/api/auth.py — los 2 endpoints
- [x] app/core/deps.py — get_current_user: extrae JWT, valida, devuelve user con org_id
- [x] Registrar router en main.py

**Done cuando:** login con ambas orgs devuelve tokens con org_id distintos,
/auth/me con token de Acme nunca devuelve datos de Globex.

---

## Bloque 5 — Verificación final (~30 min)

**Checklist:**
- [ ] docker-compose up sin errores
- [ ] GET /docs muestra la API
- [ ] POST /auth/login con admin@acme.com → JWT válido
- [ ] GET /auth/me con ese token → user de Acme con org_id correcto
- [ ] POST /auth/login con admin@globex.com → JWT con distinto org_id
- [ ] Tablas visibles en Adminer (localhost:8080)
- [ ] Re-ejecutar seed no duplica datos

# Business Logic — Versu AI Challenge

## Product Context
AI conversation analytics dashboard for a Customer Success / Operations Analyst
at a SaaS chatbot platform for e-commerce.

The end user is NOT a developer: they need clear metrics, interactive charts,
and detection of underperforming AI conversations.

---

## Multi-Tenancy

- Every data entity carries `org_id` (UUID).
- JWT includes `org_id` in claims.
- The `get_current_user` dependency exposes `org_id` from the authenticated user.
- **Golden rule:** no endpoint may return data from another org.
  Every query carries `.where(Model.org_id == current_user.org_id)`.
- Seed orgs: "Acme Corp" and "Globex Inc".

---

## Authentication

- JWT signed with HS256, expires in 24h.
- Claims: `sub` (user_id), `org_id`, `email`.
- Endpoints: `POST /auth/login`, `GET /auth/me`.
- No public registration — users are created via seed or admin.

---

## Conversations

- Statuses: `open` | `closed`.
- Channels: `web` | `whatsapp` | `instagram`.
  - Chats created from the frontend are always channel `web`.
  - WhatsApp and Instagram are simulated in seed data.
- Rating: integer 1–5, nullable until the user rates.
- On close, `closed_at` is recorded.

---

## Messages

- Role: `user` | `ai`.
- `response_time_ms`: time the AI took to respond (only on role=ai messages).
- `prompt_used`: snapshot of the system prompt used (for worst-prompts analytics).
- The AI response arrives via WebSocket streaming, token by token.
- Once complete, the full message is saved to the DB.

---

## Prompts / Agent Personalities

- 4 prompts seeded per org (same personalities for both orgs).
- Only one can be `is_default=True` per org at a time.
- The default prompt is used as the system message in the Groq API call.
- Personalities:
  1. "Asistente Amigable" — default
  2. "Asistente Formal"
  3. "El Gringo" — Spanglish mix
  4. "Experto Técnico"

---

## Analytics & KPIs

### Summary Page (DashboardPage)
- Conversations today (+ % delta vs yesterday)
- Satisfaction rate — % with rating ≥ 4 (+ delta vs previous week)
- Avg AI response time in ms (+ delta vs previous week, inverted: lower is better)
- Total conversations this week
- Volume chart with period selector: Hoy (hourly), Semana (daily), Mes (30 days)

### Analytics Page (AnalyticsPage)
- Channel distribution pie chart (web / whatsapp / instagram)
- Rating distribution bar chart (1–5)
- Top 5 worst-performing prompts table (by avg rating, with conversation count)

---

## AI API

- Provider: **Groq** (free tier, native streaming, OpenAI-compatible format).
- Model: `llama-3.1-8b-instant`.
- Flow: user message → backend → Groq API (streaming) → WebSocket → frontend token by token.
- API key stored in `.env`, displayed (not editable) in the Settings view.

---

## WebSockets

- Endpoint: `ws://host/ws/conversations/{conversation_id}?token=...`
- Auth: JWT passed as query param.
- Message flow:
  1. Frontend sends: `{"type": "message", "content": "hello"}`
  2. Backend validates token and verifies conversation belongs to org.
  3. Backend calls Groq in streaming mode.
  4. Per token received: `{"type": "token", "content": "..."}`
  5. On completion: `{"type": "done", "message_id": "uuid"}`
  6. Backend saves user message + AI message to DB.
- Real-time broadcast: when a new conversation is created via REST, all WebSocket clients of the same org receive `{"type": "new_conversation", ...}`.

---

## Infrastructure

- IaaS: **Render** (free tier).
- Terraform provisions: backend web service + frontend static site + managed PostgreSQL.
- CI: GitHub Actions on push to main → ruff lint + tsc + Docker build.
- Observability: Prometheus + Grafana in docker-compose (local only, not deployed to Render).

---

## Prometheus Metrics

Exposed at `/metrics`:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | HTTP requests by method, handler, status |
| `http_request_duration_seconds` | Histogram | HTTP latency |
| `ws_active_connections` | Gauge | Currently open WebSocket connections |
| `ai_api_request_duration_seconds` | Histogram | Groq API call latency |

Grafana dashboard auto-provisioned with 8 panels on container start.

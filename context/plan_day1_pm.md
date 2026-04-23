# Day 1 — Afternoon: Backend APIs & Frontend

## Goal
By the end of this block: all REST + WebSocket endpoints working, full React frontend
with auth, real-time chat, and 4 pages functional.

---

## Block 5 — Backend APIs

**Conversations:**
- [x] `GET /conversations` — list by org with message counts
- [x] `POST /conversations` — create + real-time broadcast to connected WebSocket clients
- [x] `GET /conversations/{id}` — detail with sorted messages
- [x] `PATCH /conversations/{id}/close` — set status=closed + closed_at
- [x] `PATCH /conversations/{id}/rate` — set rating 1–5

**Prompts:**
- [x] `GET /prompts` — list active prompts for org
- [x] `PATCH /prompts/{id}/set-default` — toggle default (unsets previous)

**Analytics:**
- [x] `GET /analytics` — KPIs, daily/hourly volume, rating distribution, channel distribution, top 5 worst prompts

**WebSocket:**
- [x] `WS /ws/conversations/{id}?token=` — JWT auth via query param
- [x] Groq streaming (llama-3.1-8b-instant), token-by-token: `{"type":"token","content":"..."}`
- [x] Done event: `{"type":"done","message_id":"uuid"}`
- [x] Saves user message + AI message (with response_time_ms + prompt_used) to DB
- [x] Context window: last 10 messages passed as history to Groq

---

## Block 6 — Frontend (React + Vite + Tailwind v4)

**Setup & infrastructure:**
- [x] Vite (react-ts) + Tailwind v4 + shadcn CSS variables + Radix UI primitives
- [x] `src/api/client.ts` — axios + 401 interceptor (redirects to /login)
- [x] `context/AuthContext.tsx`
- [x] Sidebar: Resumen, Conversaciones, Analytics, Configuración
- [x] `pages/LoginPage.tsx`
- [x] `frontend/Dockerfile` + nginx.conf
- [x] `npx tsc --noEmit` passes, `npm run build` succeeds

**DashboardPage (Resumen):**
- [x] KPI cards: Conversaciones hoy (+% delta vs yesterday), Satisfacción (+delta vs prev week), Tiempo de respuesta (+delta), Total semana
- [x] Period-selector line chart: Hoy (hourly 0–23h), Semana (Mon–Sun), Mes (30 days)

**ConversationsPage:**
- [x] Table columns: ID, Fecha inicio, Duración, Estado, Canal, Mensajes, Rating, Acciones
- [x] Filter: estado (dropdown: Todas/Abierta/Cerrada)
- [x] Filter: rating mínimo + rating máximo (dropdowns, cross-validated)
- [ ] **MISSING: date range filter** (challenge requires: rango de fechas, estado, rating mínimo, canal)
- [ ] **MISSING: channel filter** (challenge requires canal as a filter option)
- [ ] **MISSING: pagination** (challenge NFR: "paginación en tablas")
- [x] Real-time broadcast: backend sends new_conversation event to org's WS clients
- [ ] **UNVERIFIED: does ConversationsPage actually receive and render real-time new_conversation events?** (hook is on ChatPage, not ConversationsPage)
- [x] Create new conversation button

**AnalyticsPage:**
- [x] Channel distribution pie chart
- [x] Rating distribution bar chart
- [x] Top 5 worst prompts table

**SettingsPage:**
- [x] Org name, user email, Groq API key (display only)
- [x] Agent personalities: 4 prompts with set-default button

**ChatPage:**
- [x] Full message history, streaming AI response, ThinkingBubble, StreamingBubble
- [x] AI avatar (green "IA") + user avatar (blue initial)
- [x] Message timestamp (HH:MM), close conversation, rating 1–5
- [x] hooks/useConversationWS.ts — thinking/streaming/connected states

---

## Status: ✅ Mostly complete — 3 items pending (see MISSING above)

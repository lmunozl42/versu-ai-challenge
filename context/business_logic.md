# Lógica de Negocio — Versu AI Challenge

## Contexto del producto
Dashboard de análisis de conversaciones de IA para un Customer Success / Operations Analyst
de una plataforma SaaS de chatbots para e-commerce.

El usuario final NO es desarrollador: necesita métricas claras, gráficos interactivos
y detección de problemas en conversaciones de IA.

---

## Multi-tenancy

- Toda entidad de datos lleva `org_id` (UUID).
- El JWT incluye `org_id` en los claims.
- La dependency `get_current_user` expone el `org_id` del usuario autenticado.
- **Regla de oro:** ningún endpoint puede devolver datos de otra org.
  Toda query lleva `.where(Model.org_id == current_user.org_id)`.
- Orgs seed: "Acme Corp" y "Globex Inc".

---

## Autenticación

- JWT firmado con HS256, expira en 24h.
- Claims: sub (user_id), org_id, email.
- Endpoints: POST /auth/login, GET /auth/me.
- No hay registro público: los usuarios se crean por seed o admin.

---

## Conversaciones

- Estados: `open` | `closed`.
- Canales: `web` | `whatsapp` | `instagram`.
  - Los chats creados desde el frontend siempre son canal `web`.
  - WhatsApp e Instagram son simulados/mockeados en seed.
- Rating: entero 1–5, nullable hasta que el usuario califique.
- Al cerrar una conversación se guarda `closed_at`.

---

## Mensajes

- Role: `user` | `ai`.
- `response_time_ms`: tiempo que tomó la IA en responder (solo en mensajes role=ai).
- `prompt_used`: snapshot del system prompt que se usó (para analytics de Top 5 peores prompts).
- La respuesta de la IA llega en streaming vía WebSocket, token por token.
- Una vez completa, se guarda el mensaje completo en BD.

---

## Prompts / Personalidades del agente

- 4 prompts hardcodeados por org (mismos para ambas orgs en seed).
- Solo uno puede ser `is_default=True` por org.
- El prompt seleccionado se usa como system message en la llamada a la API de IA.
- Personalidades:
  1. "Asistente amigable y joven" (default)
  2. "Profesional formal y conciso"
  3. "Gringo que habla español con dificultad"
  4. "Experto técnico muy detallista"
- CRUD opcional para añadir/eliminar prompts.

---

## Métricas y Analytics

### KPIs (vista Resumen)
- Total conversaciones (hoy / semana / mes) — filtrado por org.
- % conversaciones satisfactorias (rating >= 4).
- Tiempo promedio de respuesta IA (avg de response_time_ms en mensajes role=ai).
- Gráfico de tendencia: volumen de chats por día (últimos 30 días).

### Analytics
- Distribución de ratings: histograma 1–5 (% de cada puntuación).
- Pie chart: % de conversaciones por canal (web / whatsapp / instagram).
- Tabla: Top 5 prompts con peor rating promedio.

---

## API de IA

- Proveedor: **Groq** (free tier, streaming nativo, compatible con formato OpenAI).
- Modelo: llama-3.1-8b-instant (rápido) o mixtral-8x7b (más capaz).
- Flujo: mensaje usuario → backend → Groq API (streaming) → WebSocket → frontend token a token.
- La API key se guarda en .env, solo se visualiza (no edita) en la vista Configuración.

---

## WebSockets

- Endpoint: `ws://host/ws/conversations/{conversation_id}`
- Autenticación: el token JWT se pasa como query param `?token=...`.
- Flujo de un mensaje:
  1. Frontend envía JSON: `{"type": "message", "content": "hola"}`
  2. Backend valida token y org_id de la conversación.
  3. Backend llama a Groq en streaming.
  4. Por cada token recibido, backend envía: `{"type": "token", "content": "..."}`
  5. Al terminar: `{"type": "done", "message_id": "uuid"}`
  6. Backend guarda mensaje user + mensaje ai en BD.
- Real-time tabla: cuando se crea conversación nueva, se notifica a todos los WS de la misma org.

---

## Infraestructura

- IaaS: **Render** (free tier).
- Terraform provisiona: web service backend, static site frontend, PostgreSQL managed.
- CI: GitHub Actions en push a main → lint + build Docker image.
- Observabilidad: Prometheus + Grafana en docker-compose (local), no desplegados.

---

## Observabilidad (Prometheus)

Métricas expuestas en `/metrics`:
- `http_requests_total` — counter, labels: method, path, status_code
- `http_request_duration_seconds` — histogram
- `ws_active_connections` — gauge
- `ai_api_request_duration_seconds` — histogram

Dashboard Grafana (provisionado automáticamente):
- Request rate (req/s)
- Latencia p95
- Tasa de errores 5xx
- Latencia API de IA
- Conexiones WebSocket activas

# Plan Día 1 Tarde + Día 2: APIs + Frontend + Infra

## Bloque 6 — APIs Backend (conversaciones, prompts, analytics)

**Tareas:**
- [x] app/schemas/conversations.py
- [x] app/schemas/prompts.py
- [x] app/schemas/analytics.py
- [x] app/api/conversations.py — CRUD + close + rate
- [x] app/api/prompts.py — list + set-default
- [x] app/api/analytics.py — KPIs + volumen + rating + canal + worst prompts
- [x] app/api/ws.py — WebSocket + streaming Groq
- [x] main.py — registrar todos los routers

---

## Bloque 7 — Frontend (React + Vite + Tailwind v4)

**Tareas:**
- [x] Scaffolding con Vite (react-ts)
- [x] Tailwind v4 + @tailwindcss/vite + CSS variables shadcn
- [x] Radix UI primitivos (slot, dialog, select, label, toast, separator)
- [x] src/lib/utils.ts (cn)
- [x] components/ui: Button, Card, Badge, Input, Label
- [x] src/api/: client.ts (axios + interceptors), auth.ts, conversations.ts, analytics.ts, prompts.ts
- [x] context/AuthContext.tsx
- [x] components/layout/: Sidebar.tsx, AppLayout.tsx
- [x] pages/LoginPage.tsx — login con cuentas demo
- [x] pages/DashboardPage.tsx — KPIs + 4 gráficos
- [x] pages/ConversationsPage.tsx — lista + filtros + crear nueva
- [x] hooks/useConversationWS.ts — WebSocket con streaming
- [x] pages/ChatPage.tsx — chat en tiempo real + close + rating
- [x] pages/PromptsPage.tsx — gestión de prompts
- [x] pages/SettingsPage.tsx — info org + API key
- [x] App.tsx — router con rutas protegidas
- [x] frontend/Dockerfile + nginx.conf
- [x] tsc --noEmit pasa sin errores
- [x] npm run build exitoso

---

## Bloque 8 — Infra y Observabilidad

**Tareas:**
- [x] docker-compose.yml — agregar prometheus + grafana + frontend
- [x] infra/prometheus/prometheus.yml
- [x] infra/grafana/provisioning/ (datasource + dashboard provider)
- [x] infra/terraform/main.tf — Render web service + static site + postgres
- [x] infra/terraform/variables.tf
- [x] .github/workflows/ci.yml — lint + type check + docker build

---

## Pendiente / Verificación final

- [ ] Configurar GROQ_API_KEY en .env local
- [ ] docker-compose up — verificar todos los servicios
- [ ] Login con admin@acme.com y admin@globex.com
- [ ] Crear conversación y chatear con IA (streaming)
- [ ] Verificar aislamiento de orgs
- [ ] Dashboard muestra datos seed
- [ ] Prometheus scrape en :9090
- [ ] Grafana accesible en :3000
- [ ] Crear repo público en GitHub y push
- [ ] Deploy en Render (manual o vía Terraform)

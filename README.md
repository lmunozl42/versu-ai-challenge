# Versu AI Challenge

[![CI](https://github.com/lmunozl42/versu-ai-challenge/actions/workflows/ci.yml/badge.svg)](https://github.com/lmunozl42/versu-ai-challenge/actions/workflows/ci.yml)

**Demo en vivo:** https://versu-frontend.onrender.com/

Dashboard de análisis de conversaciones de IA para operaciones de Customer Success. Permite gestionar conversaciones en tiempo real con streaming de respuestas vía WebSocket, analizar métricas de rendimiento y monitorear la infraestructura con Prometheus + Grafana.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy 2 async + asyncpg |
| Base de datos | PostgreSQL 16 |
| Migraciones | Alembic |
| IA | Groq (llama-3.1-8b-instant) con streaming |
| Frontend | React 18 + Vite + Tailwind v4 + TanStack Query |
| Tiempo real | WebSockets nativos (FastAPI) |
| Observabilidad | Prometheus + Grafana |
| IaC | Terraform (Render) |
| CI | GitHub Actions |
| Contenedores | Docker + Docker Compose |

## Arquitectura

```
┌─────────────┐     HTTP/WS      ┌──────────────────┐     SQL      ┌──────────────┐
│  Frontend   │ ←──────────────→ │  FastAPI Backend  │ ←──────────→ │  PostgreSQL  │
│  React/Vite │                  │  :8000            │              │  :5432       │
└─────────────┘                  └────────┬──────────┘              └──────────────┘
      :5173                               │ streaming
                                          ↓
                                   ┌─────────────┐
                                   │  Groq API   │
                                   │  (llama-3.1)│
                                   └─────────────┘

┌─────────────┐   scrape :8000   ┌──────────────┐   query    ┌──────────┐
│  Prometheus │ ←────────────── │   /metrics    │            │ Grafana  │
│  :9090      │ ────────────────→│              │ ←─────────→│ :3000    │
└─────────────┘                  └──────────────┘            └──────────┘
```

### Arquitectura modular — Frontend

```
pages → modules → services → infra/repositories
```

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Páginas | `pages/` | Componentes de ruta, orquestan módulos |
| Módulos | `modules/<dominio>/` | `use_cases/` (hooks) + `components/` por feature |
| Servicios | `services/` | Lógica de dominio pura + hooks WebSocket |
| Infra | `infra/repositories/` | Clientes HTTP axios, uno por entidad |
| Comunes | `commons/` | AuthContext, primitivos UI, layout compartido |

### Clean Architecture — Backend

El backend sigue una arquitectura limpia con capas bien definidas y dependencias unidireccionales:

```
resources → application → interfaces ← repositories ← infrastructure
                                   ↑
                               clients (Groq)
```

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Recursos | `resources/` | Endpoints HTTP y WebSocket (FastAPI routers) |
| Aplicación | `application/` | Casos de uso — lógica de negocio pura |
| Interfaces | `interfaces/` | Contratos abstractos (ABC) que cada capa debe cumplir |
| Repositorios | `repositories/` | Implementaciones SQLAlchemy, mapean ORM → entidades |
| Infraestructura | `infrastructure/` | ORM models, sesión, migraciones, seed |
| Clientes | `clients/` | Servicios externos (Groq) |
| Entidades | `entities/` | Dataclasses del dominio sin dependencias externas |

## Funcionalidades

- **Multi-tenancy**: datos completamente aislados por `org_id` en JWT y todas las queries
- **Conversaciones en tiempo real**: streaming token-a-token vía WebSocket + indicador de escritura
- **Personalidades del agente**: 4 system prompts configurables por org, uno activo como default
- **Analytics**: KPIs, volumen diario, distribución de canales, ratings, top 5 peores prompts
- **Broadcast real-time**: notificación a todos los clientes conectados cuando se crea una conversación
- **Observabilidad**: métricas HTTP, latencia de Groq y conexiones WebSocket activas en Grafana

## Requisitos

- Docker y Docker Compose
- Cuenta en [Groq](https://console.groq.com) (free tier) para obtener una API key

## Levantar en local

```bash
# 1. Clonar
git clone https://github.com/lmunozl42/versu-ai-challenge
cd versu-ai-challenge

# 2. Variables de entorno
cp .env.example .env
# Editar .env y poner GROQ_API_KEY=<tu-key>

# 3. Levantar todo
docker compose up -d --build

# 4. Verificar
curl http://localhost:8000/health   # {"status":"ok"}
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Adminer (BD) | http://localhost:8080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin/admin) |

## Credenciales demo

**Acme Corp**

| Nombre | Email | Password | Rol | Puesto |
|--------|-------|----------|-----|--------|
| Ana García | admin@acme.com | acme123 | Administrador | Customer Success Manager |
| Carlos Ruiz | soporte@acme.com | acme123 | Agente | Agente de Soporte |
| María Torres | analista@acme.com | acme123 | Analista | Analista de Datos |

**Globex Inc**

| Nombre | Email | Password | Rol | Puesto |
|--------|-------|----------|-----|--------|
| Pedro Soto | admin@globex.com | globex123 | Administrador | Head of Customer Experience |
| Lucía Mora | agente@globex.com | globex123 | Agente | Especialista en Atención al Cliente |

Cada org tiene datos completamente aislados: 20 conversaciones seed distribuidas en canales web/whatsapp/instagram con distintos ratings.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión asyncpg a Postgres | `postgresql+asyncpg://versu:versu@db:5432/versu_db` |
| `SECRET_KEY` | Clave para firmar JWT (HS256) | string aleatorio largo |
| `GROQ_API_KEY` | API key de Groq | `gsk_...` |
| `GROQ_MODEL` | Modelo de Groq a usar | `llama-3.1-8b-instant` |

## API principal

```
POST   /auth/login                    → JWT
GET    /auth/me                       → usuario autenticado

GET    /conversations                 → lista (filtrable)
POST   /conversations                 → crear
GET    /conversations/{id}            → detalle + mensajes
PATCH  /conversations/{id}/close      → cerrar
PATCH  /conversations/{id}/rate       → calificar (1-5)

WS     /ws/conversations/{id}?token=  → streaming IA

GET    /prompts                       → listar personalidades
PATCH  /prompts/{id}/set-default      → activar prompt

GET    /analytics                     → KPIs + gráficos + peores prompts

GET    /metrics                       → Prometheus scrape endpoint
GET    /health                        → health check
```

## Métricas Prometheus

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `http_requests_total` | Counter | Requests HTTP por handler y status |
| `http_request_duration_seconds` | Histogram | Latencia HTTP |
| `ws_active_connections` | Gauge | Conexiones WebSocket abiertas ahora |
| `ai_api_request_duration_seconds` | Histogram | Latencia de llamadas a Groq |

El dashboard de Grafana se provisiona automáticamente al levantar el contenedor.

## Mejoras UX/UI

Cambios realizados respecto al mockup entregado, con su justificación.

### 1. Navbar con org, usuario y menú de perfil
El mockup no incluía logout ni identidad del usuario activo. Se agregó una navbar con el nombre de la org y del usuario visibles de forma persistente, más un avatar que despliega acceso al perfil y logout. Los datos de perfil (nombre, email, puesto, rol) se movieron a una página dedicada — mezclarlos en Configuración confundiría responsabilidades en un modelo multi-usuario.

### 2. Selector de período en el gráfico de volumen (Hoy / Semana / Mes)
El mockup solo mostraba la vista semanal. Se agregaron vistas por hora (Hoy) y por mes para que el analista pueda detectar patrones intradía o tendencias de largo plazo sin cambiar de página.

### 3. Sidebar colapsable
Una sidebar fija consume espacio horizontal innecesario al revisar tablas o gráficos anchos. El ícono hamburguesa la colapsa a solo íconos, patrón estándar en dashboards analíticos.

### 4. Filtro de fecha con rango "Desde / Hasta"
Un único selector de fecha solo permite filtrar por día exacto. Dos inputs independientes permiten definir cualquier ventana arbitraria (e.g. último trimestre).

### 5. Filtro de rating con rango mínimo/máximo y validación cruzada
Un filtro de rango es más útil que un único valor (e.g. "ratings entre 2 y 4"). La validación cruzada evita un estado imposible que retornaría cero resultados en silencio, confundiendo al analista.

### 6. Columna de cantidad de mensajes en Conversaciones
Permite identificar de un vistazo conversaciones que escalaron (muchos mensajes) versus las resueltas rápido, sin necesidad de abrirlas.

### 7. Ícono de ojo en columna de Acciones
Reemplaza el botón de texto "Ver". Los íconos mantienen la tabla compacta y el diseño extensible para acciones futuras sin rediseñar la columna.

### 8. Paginación con selector de tamaño de página
Renderizar todas las conversaciones sin paginar degrada el rendimiento. Se agregaron opciones de 10/20/50 filas y navegación con elipsis inteligente ("1–10 de 47").

### 9. Filtro por canal
Permite al analista segmentar por Web, WhatsApp o Instagram directamente desde la tabla, sin tener que identificar las filas relevantes de forma visual.

### 10. Tooltip del cálculo de impacto en Analytics
La fórmula `(5 − rating promedio) × conversaciones` se muestra en un tooltip al hacer hover sobre la columna Impacto. Una métrica derivada sin contexto genera desconfianza; el tooltip la contextualiza en el punto de uso.

### 11. Botón para limpiar filtros en Conversaciones
Cuando hay filtros activos, aparece un botón "Limpiar filtros" que los restablece todos a sus valores por defecto en un solo click. Sin él, el analista tendría que resetear cada dropdown e input manualmente.

### 12. Flujo de cierre con confirmación y calificación
Cerrar una conversación es irreversible. Un diálogo de confirmación evita cierres accidentales. Al confirmar, se encadena automáticamente un segundo diálogo de calificación (1–5 estrellas), aprovechando el momento en que la conversación está fresca para aumentar la tasa de ratings.

## Herramientas de IA utilizadas

| Herramienta | Uso |
|-------------|-----|
| **Claude Code** (claude-sonnet-4-6) | Asistente de desarrollo principal: scaffolding, implementación de endpoints, frontend, refactors de arquitectura, debugging de CI y revisión de código |
| **Groq** (llama-3.1-8b-instant) | Motor de IA en producción: genera respuestas en streaming dentro de las conversaciones del dashboard |

## Alcance

### Completado

| Requisito | Estado |
|-----------|--------|
| JWT auth + multi-tenancy por `org_id` | ✅ |
| CRUD conversaciones + close + rate | ✅ |
| Streaming IA token-a-token vía WebSocket | ✅ |
| 4 vistas: Resumen, Conversaciones, Analytics, Configuración | ✅ |
| Filtros en Conversaciones: estado, canal, rating mín/máx, rango de fechas | ✅ |
| Paginación en tabla de Conversaciones con selector de tamaño de página | ✅ |
| Flujo de cierre con confirmación y calificación vía diálogos | ✅ |
| Menú de usuario con dropdown en navbar (perfil + logout) | ✅ |
| Tooltip explicativo del cálculo de impacto en tabla de Analytics | ✅ |
| 4 personalidades de agente con set-default por org | ✅ |
| Analytics: KPIs, volumen, distribución de canales, ratings, peores prompts | ✅ |
| Prometheus + Grafana auto-provisionados (local) | ✅ |
| CI: ruff lint + tsc + Docker build en GitHub Actions | ✅ |
| IaC con Terraform + deploy en Render | ✅ |
| Actualizaciones en tiempo real en lista de Conversaciones vía `/ws/presence` | ✅ |
| Clean architecture backend (resources → application → interfaces ← repositories) | ✅ |
| Mejoras UX documentadas respecto al mockup | ✅ |

## CI/CD

GitHub Actions en cada push a `main`:
1. Ruff lint en backend
2. TypeScript typecheck + build en frontend
3. Docker build de ambas imágenes

## Deploy en Render

El directorio `infra/terraform/` contiene la configuración para desplegar en Render:

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Completar render_api_key, render_owner_id, github_repo_url, secret_key, groq_api_key

terraform init
terraform apply
```

Provisiona: PostgreSQL managed + Web Service (backend) + Static Site (frontend).

**URL en vivo:** https://versu-frontend.onrender.com/

## Estructura del proyecto

```
versu-ai-challenge/
├── backend/
│   ├── app/
│   │   ├── resources/      # endpoints HTTP + WebSocket (FastAPI routers)
│   │   ├── application/    # casos de uso (use_case_*.py por operación)
│   │   │   ├── auth/
│   │   │   ├── conversations/
│   │   │   ├── prompts/
│   │   │   ├── chat/
│   │   │   └── analytics/
│   │   ├── interfaces/     # contratos abstractos (ABC)
│   │   ├── repositories/   # implementaciones SQLAlchemy
│   │   ├── infrastructure/ # ORM models, session, base, seed
│   │   ├── clients/        # servicios externos (Groq)
│   │   ├── entities/       # dataclasses del dominio
│   │   ├── schemas/        # DTOs Pydantic (frontera de la API)
│   │   └── core/           # config, security, deps
│   ├── alembic/            # migraciones
│   ├── main.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── commons/              # AuthContext, UI primitives (button, card…), layout (Navbar, Sidebar)
│   │   ├── infra/
│   │   │   └── repositories/     # clientes HTTP axios por entidad (auth, conversations, analytics, prompts)
│   │   ├── services/             # lógica de dominio + hooks WS (useConversationWS, useOrgBroadcast)
│   │   ├── modules/              # módulos por dominio — cada uno con use_cases/ y components/
│   │   │   ├── summary/
│   │   │   ├── conversations/
│   │   │   ├── chat/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── pages/                # componentes de ruta (uno por vista)
│   └── Dockerfile
├── infra/
│   ├── prometheus/         # prometheus.yml
│   ├── grafana/            # datasource + dashboard provisionados
│   └── terraform/          # IaC para Render
├── .github/workflows/      # CI
└── docker-compose.yml
```

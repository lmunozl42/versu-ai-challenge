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

| Org | Email | Password |
|-----|-------|----------|
| Acme Corp | admin@acme.com | acme123 |
| Globex Inc | admin@globex.com | globex123 |

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

Los siguientes cambios se realizaron respecto al mockup entregado, cada uno con su justificación documentada.

### 1. Navbar fija con nombre de org y botón de cierre de sesión
**Qué:** Se agregó una navbar superior que muestra el nombre de la organización autenticada y un botón de logout visible.  
**Por qué:** El mockup no incluía un mecanismo para cerrar sesión. Durante las pruebas no era claro cómo cambiar entre organizaciones o terminar una sesión. Una navbar fija mantiene la org actual siempre visible y ofrece una acción de logout consistente y fácil de encontrar — patrón estándar en dashboards SaaS.

### 2. Selector de período en el gráfico de volumen (Hoy / Semana / Mes)
**Qué:** El gráfico de volumen de conversaciones en Resumen ahora tiene tres vistas seleccionables: Hoy (por hora, 0–23h), Semana (últimos 7 días por nombre de día) y Mes (últimos 30 días).  
**Por qué:** El mockup original solo mostraba una vista semanal. Un período fijo limita la capacidad del analista para detectar patrones intradía (e.g. horas pico) o tendencias a largo plazo. El selector agrega valor analítico significativo con mínima complejidad visual.

### 3. Sidebar colapsable con menú hamburguesa
**Qué:** La sidebar puede colapsarse mediante un ícono de hamburguesa, ocultando las etiquetas de navegación y dando más espacio horizontal al área de contenido.  
**Por qué:** El mockup mostraba una sidebar permanentemente expandida. En pantallas más pequeñas o al revisar tablas y gráficos anchos, una sidebar de ancho fijo reduce el espacio disponible. Una sidebar colapsable es un patrón estándar en dashboards de analítica y mejora la usabilidad en distintos tamaños de pantalla.

### 4. Filtro de fecha dividido en "Desde" y "Hasta"
**Qué:** El filtro de fecha en Conversaciones se dividió en dos inputs independientes: fecha de inicio (Desde) y fecha de fin (Hasta).  
**Por qué:** El mockup mostraba un único selector de fecha. Un solo campo solo permite filtrar por un día exacto, imposibilitando el análisis de rangos de tiempo. Dos inputs independientes permiten al analista definir cualquier ventana arbitraria (e.g. último trimestre, una semana de incidente específica) sin restricciones.

### 5. Filtro de rating con rango mínimo/máximo y validación cruzada
**Qué:** El filtro de rating se dividió en dos dropdowns separados — Rating mínimo y Rating máximo. Una regla de validación cruzada impide que el mínimo supere al máximo y viceversa: seleccionar un mínimo mayor al máximo actual ajusta automáticamente el máximo, y seleccionar un máximo menor al mínimo actual ajusta el mínimo.  
**Por qué:** El mockup mostraba un único filtro de rating. Un filtro de rango es más útil para el análisis (e.g. "ratings entre 2 y 4"). La validación cruzada evita un estado de filtro imposible que silenciosamente retornaría cero resultados, confundiendo al analista haciéndole creer que no hay datos.

### 6. Columna de cantidad de mensajes en la tabla de Conversaciones
**Qué:** Se agregó una columna Mensajes a la tabla de conversaciones que muestra el total de mensajes intercambiados en cada conversación.  
**Por qué:** La cantidad de mensajes es un indicador directo de la complejidad y el nivel de engagement de una conversación. El analista puede identificar rápidamente conversaciones que escalaron (muchos mensajes) versus las resueltas de inmediato (pocos mensajes), sin necesidad de abrir cada una.

### 7. Ícono de ojo en la columna de Acciones en lugar de botón de texto
**Qué:** El botón de texto "Ver" en la columna Acciones fue reemplazado por un ícono de ojo.  
**Por qué:** Un botón de texto ocupa espacio horizontal considerable y escala mal cuando se agregan acciones adicionales. Las columnas de acciones basadas en íconos son un patrón estándar en tablas de datos: cada acción tiene un ícono pequeño con tooltip, manteniendo la tabla compacta y consistente sin importar cuántas acciones estén presentes. Esto hace el diseño extensible para acciones futuras (e.g. eliminar, exportar) sin rediseñar la columna.

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
| Filtros en Conversaciones: estado, rating mín/máx, rango de fechas | ✅ |
| 4 personalidades de agente con set-default por org | ✅ |
| Analytics: KPIs, volumen, distribución de canales, ratings, peores prompts | ✅ |
| Prometheus + Grafana auto-provisionados (local) | ✅ |
| CI: ruff lint + tsc + Docker build en GitHub Actions | ✅ |
| IaC con Terraform + deploy en Render | ✅ |
| Clean architecture backend (resources → application → interfaces ← repositories) | ✅ |
| Mejoras UX documentadas respecto al mockup | ✅ |

### No implementado por tiempo

| Requisito | Notas |
|-----------|-------|
| Filtro por canal en Conversaciones | El filtrado por canal no fue implementado en el frontend; el dato existe en el modelo y en seed |
| Paginación en tabla de Conversaciones | La tabla renderiza todos los resultados sin paginar |
| Actualizaciones en tiempo real en la lista de Conversaciones | La lista usa polling cada 15 s; el broadcast WebSocket llega solo a clientes dentro de un chat activo |

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
│   │   ├── commons/        # AuthContext, utils, componentes UI y layout compartidos
│   │   ├── infra/          # repositorios HTTP (clientes axios por entidad)
│   │   ├── services/       # lógica de negocio frontend + WebSocket hook
│   │   ├── modules/        # módulos por dominio (summary, conversations, chat, analytics, settings)
│   │   │   └── <módulo>/
│   │   │       ├── use_cases/    # hooks de caso de uso
│   │   │       └── components/   # componentes del módulo
│   │   └── pages/          # Resumen, Conversaciones, Analytics, Configuración
│   └── Dockerfile
├── infra/
│   ├── prometheus/         # prometheus.yml
│   ├── grafana/            # datasource + dashboard provisionados
│   └── terraform/          # IaC para Render
├── .github/workflows/      # CI
└── docker-compose.yml
```

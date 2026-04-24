# Day 2 — Morning: Infrastructure, Observability & CI/CD

## Goal
Full docker-compose stack (6 services), Prometheus scraping backend, Grafana auto-provisioned,
CI passing on GitHub, Terraform files ready for deploy.

---

## Block 7 — Full Docker Compose Stack

- [x] db (PostgreSQL 16), backend (:8000), frontend (:5173), adminer (:8080)
- [x] prometheus (:9090), grafana (:3000 admin/admin)
- [x] Grafana **pinned to v10.4.2** — v11 has a provisioning bug with datasource UID validation

---

## Block 8 — Prometheus & Grafana Observability

**Metrics exposed at `/metrics`:**
- [x] `http_requests_total` — counter, labels: method, handler, status
- [x] `http_request_duration_seconds` — histogram (auto-instrumented via prometheus-fastapi-instrumentator)
- [x] `ws_active_connections` — gauge (inc on WS connect, dec on disconnect)
- [x] `ai_api_request_duration_seconds` — histogram (measures real Groq API latency)

**Grafana auto-provisioning:**
- [x] `infra/grafana/provisioning/datasources/prometheus.yml` — uid: prometheus
- [x] `infra/grafana/provisioning/dashboards/dashboard.yml`
- [x] `infra/grafana/provisioning/dashboards/versu_dashboard.json` — 8 panels:
  Request rate, HTTP latency p50/p95, Error rate, Req/min stat,
  WS active connections stat, Groq latency timeseries, Process memory, Requests by status

---

## Block 9 — Real-Time Broadcast

- [x] `broadcast_new_conversation()` in `app/resources/ws.py`
- [x] Called from `POST /conversations` after DB commit
- [~] ConversationsPage uses polling (refetchInterval: 15s) — WS broadcast not consumed at list level (documented in README as not implemented)

---

## Block 10 — CI/CD

**GitHub Actions (`.github/workflows/ci.yml`):**
- [x] Backend: ruff lint + Docker build
- [x] Frontend: `tsc --noEmit` + `npm run build`
- [x] Uses `npm install` (not `npm ci`) — Windows lock file missing Linux-specific packages
- [x] CI status badge in README (line 3)

---

## Block 11 — Terraform & Deploy

- [x] `infra/terraform/main.tf` — Render web service + static site + managed PostgreSQL
- [x] `infra/terraform/variables.tf`
- [x] `infra/terraform/terraform.tfvars.example`
- [x] `terraform apply` run — Render services provisioned
- [x] Live URL deployed and in README: https://versu-frontend.onrender.com/

---

## Known Bugs Fixed

| Issue | Fix |
|-------|-----|
| Grafana 11 provisioning crash | Pinned to `grafana/grafana:10.4.2` |
| ruff E712: `== True` comparisons | Changed to bare attribute: `Prompt.is_active`, `Prompt.is_default` |
| ruff F401: unused imports | Removed `import uuid` from base.py, `Float` from models.py |
| `npm ci` failing in CI | Changed to `npm install` |
| Recharts SVG invisible line | Hardcoded `stroke="#000000"` (CSS vars don't resolve in SVG attributes) |
| Week chart date mismatch | Used `setUTCDate`/`getUTCDay` to match backend UTC timestamps |

---

## Status: ✅ Complete

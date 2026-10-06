# Helpdesk Ticketing System

Support portal where requesters raise tickets and agents manage status, priority, assignment and replies.

**Stack:** React (Vite) · Node.js/Express 5 · SQLite · Prisma · JWT · Nginx · Docker · Kubernetes

## Architecture

```
Browser -> Nginx (web, serves React + proxies /api) -> Express API -> SQLite file (volume / PVC)
```

- `backend/` Express API, Prisma schema + migrations, seed script, auto-close worker, tests
- `frontend/` React SPA, Nginx config
- `k8s/` Kubernetes manifests
- `docker-compose.yml`, `.env.example`

## Run locally (no Docker)

```bash
cd backend && cp .env.example .env && npm install
npx prisma migrate dev && npm run db:seed && npm run dev     # API on :4000
cd frontend && npm install && npm run dev                      # UI on :5173 (proxies /api)
```

Tests: `cd backend && npm test` (uses a throw-away `prisma/test.db`).

## Run with Docker Compose

```bash
cp .env.example .env          # optional; sensible defaults exist
docker compose up --build     # open http://localhost:8080
docker compose down           # stop (data kept in the db-data volume)
docker compose down -v        # stop and delete data
```

## Deploy to Kubernetes (minikube / kind / Docker Desktop)

```bash
docker compose build                                  # builds helpdesk-api:1.0 and helpdesk-web:1.0
kind load docker-image helpdesk-api:1.0 helpdesk-web:1.0   # kind
# minikube image load helpdesk-api:1.0 helpdesk-web:1.0    # minikube (Docker Desktop needs neither)

kubectl apply -f k8s/namespace.yaml && kubectl apply -f k8s/
kubectl get all -n helpdesk-ticketing-system
# NodePort 30082 -> http://localhost:30082 (Docker Desktop). On kind/minikube use port-forward:
kubectl port-forward svc/web 8080:80 -n helpdesk-ticketing-system

kubectl scale deploy/web --replicas=3 -n helpdesk-ticketing-system   # scaling demo
kubectl delete ns helpdesk-ticketing-system                          # teardown
```

**SQLite and replicas:** SQLite is a single-writer file, so the API runs as one replica
(`strategy: Recreate`, data on a PVC). The stateless **web** tier runs 2 replicas, so killing a web pod keeps
the site up. Killing the API pod causes a brief outage until it is rescheduled, and data survives via the PVC.
Scaling the API horizontally would need a client/server database such as PostgreSQL.

## Demo accounts

Seeded agents (password from `SEED_AGENT_PASSWORD`, default `Agent@123`):
`alice@helpdesk.local`, `bob@helpdesk.local`, `carol@helpdesk.local`. Three sample tickets are created on first start.

## API

| Method & path | Access | Notes |
|---|---|---|
| `POST /api/tickets` | public | subject, description, priority, email |
| `GET /api/tickets?status=&priority=&assignee=` | agent | `assignee` = agent id or `unassigned` |
| `GET /api/tickets/:id` | agent, or requester with `?email=` | includes comments |
| `PATCH /api/tickets/:id` | agent | status, priority, assigneeId |
| `POST /api/tickets/:id/comments` | agent, or requester with `email` in body | |
| `POST /api/auth/login` | public | returns JWT |
| `GET /api/stats` | agent | counts by status |
| `GET /api/agents` | agent | id + name, for assignee pickers |
| `GET /health` | public | 200 when DB reachable |

Requesters have no accounts: they need **ticket number + the email used to submit**. A wrong pair returns 404.

## Auto-close worker (stretch goal)

`worker` runs `src/worker.js`, closing tickets that have been Resolved for `AUTO_CLOSE_DAYS` (default 7).
It runs in Docker Compose only (not in `k8s/`).

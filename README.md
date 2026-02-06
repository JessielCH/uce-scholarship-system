# UCE Scholarship System

Professional README for the UCE Scholarship Management System (client + server).

Overview
- Full-stack application to manage scholarship selections, ingestion of historical data, student profiles, and admin dashboards.
- Frontend: Vite + React (client/)
- Backend: Node.js + Express (server/) with Supabase as the primary datastore and auth provider.
- Dockerized for production via `docker-compose` (root-level `docker-compose.yml`).

Quick start (local, using Docker)
1. Copy and fill environment file:

```bash
cp .env.example .env
# edit .env and set SUPABASE_URL and SUPABASE_KEY
```

2. Build and run with Docker Compose:

```bash
docker compose up --build -d
```

3. Access the frontend via the machine IP on port 80 (example: http://YOUR_SERVER_IP/) and the API at `/api` proxied by nginx.

Docker details
- `client/Dockerfile`: multi-stage build; serves static files with nginx and proxies `/api` to `server:3000`.
- `server/Dockerfile`: runs Node server on port `3000`.
- `docker-compose.yml`: brings up `server` and `client` (nginx) connected by a bridge network; `client` exposes port 80.

Environment variables
- `SUPABASE_URL` — Supabase project URL.
- `SUPABASE_KEY` — Supabase Service Role Key (server-only). Keep secret.
- `PORT` — server port (default 3000).

Security note
- Never commit real secrets. Use `.env.example` for templates. The provided `.env` in the repo contains placeholders only.

Deploying to AWS (recommended path)
1. Provision a VM (EC2) or use ECS/EKS. For a simple deploy on EC2:
   - Copy the repository to the server or pull from your remote.
   - Place your production `.env` on the server (outside of Git) at the repo root.
   - Build and run with Docker Compose: `docker compose up --build -d`.

2. If you prefer ECS or ECR:
   - Build and push images to ECR.
   - Create ECS task definitions for `server` and `client` (nginx image).

Notes about the repository
- The codebase uses Supabase for DB and Auth. The server expects a Supabase Service Role Key for ingestion endpoints.
- Console logs and comments are kept for observability during deployment; replace with a proper logger before production.

Git flow used for this deliverable
- Changes were pushed to `develop_2`, then to `develop`, then to `main` (per request). Validate branch contents before deploying.

Support
- If you want me to remove or encrypt secrets, or create a CI/CD pipeline (GitHub Actions) to build/push images to ECR and deploy to ECS, I can add that next.

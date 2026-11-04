# Deployment & What You Need

## Shopping list (beyond the server)

| Need | Why | Typical cost* |
|---|---|---|
| **Paid server** for the backend (1 vCPU, 512 MB–1 GB RAM is plenty) | No sleeping, faster responses | ~US$5–10 / month |
| **Persistent disk** on that server (1 GB is plenty) | Keeps contact messages across redeploys | Often included |
| **Domain name** (e.g. `dailyd.dev`) | Professional address, needed for HTTPS on your own name | ~US$10–20 / year |
| **HTTPS certificate** | Encryption | Free (Let's Encrypt, or included by the host) |
| **Static hosting** for the frontend | Serves the React build | Free tiers are fine (Netlify, Cloudflare Pages, Vercel, GitHub Pages) |
| **Email inbox + SMTP** (optional) | Receive contact messages by email | Free with Gmail (app password) or your domain's mail |
| **Uptime monitor** | Alerts if the site goes down | Free tiers (UptimeRobot, Better Stack) |
| **Backups** | Contact messages | Free (a cron job copying `messages.db`) |

*Rough figures; check current prices with the provider.

You do **not** need: a database server, Redis, paid APIs, or a CDN to start.
Once on a paid always-on server, the keep-alive GitHub workflow is optional
(delete `.github/workflows/keep-alive.yml` or leave it).

## Option A — Render paid plan (easiest, same setup as now)

1. Render dashboard → backend service → upgrade to a paid instance type.
2. **Disks** → add a disk mounted at `/opt/render/project/src/backend/data`
   (or set `CONTACT_DB_PATH` to the mount path + `/messages.db`).
3. **Environment**:
   ```
   APP_ENV=production
   CORS_ORIGINS=["https://your-frontend-domain"]
   # optional email forwarding
   CONTACT_EMAIL_TO=you@example.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=you@example.com
   SMTP_PASSWORD=<app password, not your normal password>
   SMTP_FROM=you@example.com
   ```
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --no-server-header`
5. Custom domain: Settings → Custom Domains (e.g. `api.your-domain`), HTTPS is automatic.

## Option B — Your own VPS (Docker)

```bash
# on the server, inside the repo's backend folder
docker build -t dailyd-backend .
docker volume create dailyd-data
docker run -d --name dailyd --restart unless-stopped \
  -p 127.0.0.1:8000:8000 -v dailyd-data:/workspace/data \
  -e APP_ENV=production -e CORS_ORIGINS='["https://your-domain"]' \
  dailyd-backend
```

Put a reverse proxy with automatic HTTPS in front, e.g. Caddy:

```
api.your-domain {
    reverse_proxy 127.0.0.1:8000
}
```

Also on a VPS: enable the firewall (only ports 22, 80, 443), turn on automatic
security updates, and log in with SSH keys only.

## Frontend

1. Set `VITE_API_BASE_URL=https://api.your-domain` in `.env.production`.
2. `npm ci && npm run build` → upload `dist/` (or let the host build from GitHub).
3. Security headers: Netlify / Cloudflare Pages read `public/_headers`
   automatically. On Vercel add the same headers in `vercel.json`; on nginx:
   ```
   add_header X-Frame-Options DENY always;
   add_header X-Content-Type-Options nosniff always;
   add_header Referrer-Policy strict-origin-when-cross-origin always;
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   ```
4. Single-page app: unknown paths should serve `index.html` (the app shows its own 404).

## Reading contact messages

```bash
cd backend && python -m app.messages        # latest 20
python -m app.messages 100                  # latest 100
```

With email forwarding set up, each message also arrives in your inbox;
pressing Reply answers the visitor directly (if they left an email).

## Launch checklist

- [ ] `APP_ENV=production`, `CORS_ORIGINS` set to your domain
- [ ] HTTPS on both frontend and API
- [ ] `curl -sI https://api.your-domain/health` shows security headers; `/docs` returns 404
- [ ] Frontend headers pass https://securityheaders.com
- [ ] Contact form tested end to end; message visible with `python -m app.messages`
- [ ] Persistent disk/volume for `data/`, and a backup plan
- [ ] Uptime monitor on `/health`
- [ ] Legal details filled in (see `LEGAL.md`)

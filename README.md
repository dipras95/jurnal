# Trading Journal

A single-user trading journal: log trades, import history from Excel, and track KPIs and monthly PnL.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · SQLite

## Features

- Password login (single user) with an HTTP-only JWT session cookie
- Dashboard with trading KPIs
- Journal table with search, filters, sorting, and pagination
- Create, edit, and delete trades, with a detail view
- Excel import (`.xlsx` / `.xls`, max 5 MB) for existing trade history
- Analytics: monthly PnL and status breakdown

## Excel import format

The first sheet must use these headers:

```
Date, Pair, Position, Strategy, Timeframe, Leverage, Entry, SL, TP, Exit,
Link Before, Link After, Notes, Risk $, SL Dist %, Pos Size $, R:R Plan,
Margin $, Status, PnL $, R:R Actual, Balance, Drawdown %
```

## Local setup

```bash
npm install
cp .env.example .env      # then edit the values
npx prisma generate
npx prisma db push
npm run db:seed           # creates the login user from APP_USERNAME / APP_PASSWORD
npm run dev
```

## Security notes

- Every page and API route, including the Excel import, requires a valid session. Auth runs in `src/proxy.ts` (Next.js 16 proxy, Node runtime) and again inside the import route.
- `JWT_SECRET` is required in production. The app refuses to sign or accept tokens without it rather than falling back to a default.
- Change `APP_PASSWORD` before seeding anything you deploy.

## Deploying to an Ubuntu VPS (PM2 + Nginx)

```bash
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs && sudo npm i -g pm2

git clone <repo> jurnal && cd jurnal
npm ci
cp .env.example .env      # set a strong JWT_SECRET and APP_PASSWORD
npx prisma generate && npx prisma db push && npm run db:seed
npm run build
pm2 start npm --name jurnal -- start && pm2 save && pm2 startup
```

Nginx reverse proxy (`/etc/nginx/sites-available/jurnal`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/jurnal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

Add HTTPS with Certbot before using it over the internet, since the session cookie is marked `Secure` in production.

## Scope

Single-user by design: no exchange API integration and no real-time data. The UI is dark and desktop-focused.

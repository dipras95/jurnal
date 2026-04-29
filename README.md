# Jurnal Trading Pribadi

Stack: Next.js + TypeScript + Tailwind + shadcn/ui + Prisma + SQLite.

## Fitur
- Login sederhana (single user)
- Dashboard KPI lengkap
- Journal table: search, filter, sort, pagination
- CRUD trade manual
- Trade detail modal
- Import data awal dari Excel (.xlsx/.xls)
- Analytics (monthly PnL + status breakdown)

## Format kolom Excel
Harus sesuai header:
Date, Pair, Position, Strategy, Timeframe, Leverage, Entry, SL, TP, Exit, Link Before, Link After, Notes, Risk $, SL Dist %, Pos Size $, R:R Plan, Margin $, Status, PnL $, R:R Actual, Balance, Drawdown %

## Local Setup
```bash
npm install
npx prisma generate
# Jika engine Prisma bermasalah di mesin lokal, langsung lanjut dev mode.
npm run dev
```

Default login dari `.env`:
- username: `admin`
- password: `admin123`

## Prisma + SQLite
`.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-super-secret"
APP_USERNAME="admin"
APP_PASSWORD="admin123"
```

Seed user default:
```bash
npm run db:seed
```

## Deploy Ubuntu VPS (PM2 + Nginx)

### 1. Install dependency server
```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### 2. Deploy app
```bash
git clone <repo> jurnaltrade
cd jurnaltrade
npm ci
cp .env.example .env  # atau buat .env manual
npx prisma generate
# Jika migrate tersedia:
# npx prisma migrate deploy
# Jika tidak pakai migration file, pakai:
# npx prisma db push
npm run build
```

### 3. Jalankan dengan PM2
```bash
pm2 start npm --name jurnaltrade -- start
pm2 save
pm2 startup
```

### 4. Nginx reverse proxy
`/etc/nginx/sites-available/jurnaltrade`
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

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/jurnaltrade /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Catatan
- App ini memang single-user, tanpa Binance API, tanpa realtime.
- UI didesain dark, clean, dan desktop-focused.

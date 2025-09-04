# Vehicle Services System — Local Dev

## Prerequisites
- Node.js 18+
- MySQL 8 (local or Docker)

## Option A: Docker for MySQL
1) docker compose up -d
2) Copy .env.local.example to .env.local (values match docker-compose.yml)

## Option B: Your own MySQL
1) Create DB and user
2) Set .env.local with your credentials

## Install and Initialize
- npm install
- npm run db:setup

## Run
- npm run dev
- Open http://localhost:3000
  - /dashboard, /customers, /appointments/new, /services, /technicians

Troubleshooting
- Check .env.local values
- Ensure MySQL is running and accessible on MYSQL_HOST:MYSQL_PORT

# ChainGuard Server (Dev Scaffold)

This folder contains a minimal Express + TypeScript backend, a Prisma schema for PostgreSQL, and a Hardhat contract to bootstrap local development.

Quick start (PowerShell):

```powershell
# 1) Start Postgres (via docker-compose)
docker-compose up -d

# 2) Install server deps
cd server
npm install

# 3) Create .env from template and adjust if needed
copy .env.template .env

# 4) Generate Prisma client and run migration
npx prisma generate
npx prisma migrate dev --name init

# 5) Start Hardhat node (in separate terminal)
npx hardhat node

# 6) Deploy contract to local hardhat node
# In this terminal (server folder)
npm run deploy:local

# 7) Start server
npm run dev
```

Notes:
- Do NOT commit real private keys. Use `.env` to supply `PRIVATE_KEY` and `RPC_URL` when targeting testnets.
- The server exposes basic endpoints under `/api/*` for product and chain transaction operations.

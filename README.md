# FlowLedger

FlowLedger is a Next.js 15 shared-expense app for groups that need date-aware membership, CSV import review, anomaly detection, settlements, audit logs, and INR/USD balance summaries.

## Stack

- Next.js 15 App Router
- JavaScript only
- Prisma with PostgreSQL
- Tailwind CSS and shadcn-style UI primitives
- JWT auth with HTTP-only cookie support
- Framer Motion installed for UI motion work

## Local Setup

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Set `DATABASE_URL` to a local PostgreSQL database or a hosted PostgreSQL provider such as Neon. Set `JWT_SECRET` to a random secret that is at least 16 characters long.

Seeded login:

```text
aisha@example.com
Aisha@123
```

## Useful Commands

```bash
npm run lint
npm run build
npx prisma validate
npx prisma migrate deploy
```

Use `npx prisma migrate deploy` in production after configuring production environment variables.

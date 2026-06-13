# Shared Expenses

Full-stack shared expenses app for importing, validating, splitting, and settling flatmate expenses.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Frontend: React with Vite
- Auth: JWT
- Currency policy: static conversion rate, `1 USD = 83 INR`

## First Setup

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

The first migration creates the relational schema required by the assignment, including time-bounded group membership and import anomaly tracking.


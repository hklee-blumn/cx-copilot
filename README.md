# CX Copilot

An AI-first customer support app. An AI agent (Claude) handles customer
conversations first — answering questions from a help-center knowledge
base and deciding refund requests under set dollar thresholds — and
escalates to a human agent dashboard only when it can't or shouldn't
decide alone. Every refund decision (AI or human) is logged with its
reasoning for audit.

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- Prisma + SQLite (local dev) — see `prisma/schema.prisma`
- Anthropic Claude API (`@anthropic-ai/sdk`) for the AI agent's replies and
  refund decisions, using forced tool-use for structured output
  (`src/lib/ai/`)
- Clerk for agent (staff) login on `/dashboard` — customer-facing `/chat`
  is intentionally open (no customer accounts yet)

## Local development

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Then open `http://localhost:3000`. You'll need a `.env.local` with:

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL="file:./dev.db"
```

- `/chat` — pick a seeded demo customer and talk to the AI agent.
- `/dashboard` — sign in (Clerk) to see escalated conversations, take one
  over, and reply as a human agent.

## Refund decision logic

Every refund request gets a structured decision from Claude (approve /
reject / escalate, with required reasoning and a confidence score), but
the dollar thresholds are enforced in application code
(`src/lib/ai/thresholds.ts`), not trusted from the model: refunds over $50
are always escalated to a human, regardless of what the model outputs.

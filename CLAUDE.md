# CLAUDE.md — Working rules for this project

This is a **working, deployed Next.js app**. Treat it as production. The biggest risk to this
project is an assistant rewriting files wholesale and breaking a build that already worked.

## RULE 1 — Spot-edit. Never rewrite.

- Make the **smallest possible change** to accomplish the task. Edit the specific lines involved.
- **Never** regenerate, rewrite, or recreate an entire file unless the user explicitly says
  "rewrite this file from scratch."
- **Never** rewrite multiple files in one pass to do one feature. Touch only what the task needs.
- Do not "clean up," reformat, reorder imports, or restyle code you weren't asked to change.
- If a change feels like it needs a broad rewrite, **stop and ask first**. Explain why and scope it.
- Preserve existing patterns, naming, and structure even if you'd personally do it differently.

## RULE 2 — Don't break the deploy

This app deploys to Vercel. Before suggesting or making changes, respect these invariants:

- **next-auth is pinned to `5.0.0-beta.25` on purpose.** Do NOT bump it. Betas break between
  versions. If auth work is needed, work within this version.
- **`AUTH_TRUST_HOST=true` must be set** in the deployment env (NextAuth v5 behind Vercel's proxy).
  If auth callbacks misbehave on deploy, check this before touching code.
- **Do not touch `package.json` scripts, the `prisma` config block, or `next.config.mjs`**
  unless that is the explicit task.
- The `build` script runs `prisma generate && next build` — it needs network at build time.
  That's expected on Vercel; it's not a bug to "fix."

## RULE 3 — Env vars

- `.env` is the source of truth (gitignored). `.env.example` lists required keys — keep them in sync.
- Redis is dual-named: code accepts `KV_REST_API_*` **or** `UPSTASH_REDIS_REST_*` (see `lib/streaks.ts`).
  Don't "simplify" this without checking which names the deployment actually provisions.
- `SEED_ADMIN_EMAIL` is used by `prisma/seed.mjs` (optional, defaults to `admin@example.com`).

## RULE 4 — Schema changes are high-risk

- `prisma/schema.prisma` validates and is already `prisma format`-clean. Don't reformat it.
- Any schema change requires a migration and can affect live data. Make schema edits surgically,
  field by field, and call out the migration the user needs to run.

## Architecture map (so you don't get lost and "reset" things)

- `app/` — Next.js App Router. Pages are `force-dynamic`; API routes under `app/api/`.
- `components/` — client components (`"use client"`), one per feature view.
- `lib/` — server logic: `auth.ts` (NextAuth), `prisma.ts` (client singleton), `esv.ts` (Bible API),
  `streaks.ts` (Redis streaks/points), `unlock.ts` (day-unlock logic), `church.ts`, `theme.ts`.
- `prisma/` — `schema.prisma` + `seed.mjs`.
- Every API route already enforces auth + church-ownership checks. Keep that pattern on new routes.

## Before you finish

- Run `npx tsc --noEmit` and make sure it passes.
- Confirm you changed only the files the task required. If you touched more, explain why.

# AGENTS.md

## Quality gates (run after any code changes)

```bash
npm run lint      # must finish with 0 errors AND 0 warnings
npx tsc --noEmit  # must finish with no errors
npm run build     # must succeed
```

If the build fails, keep the letters/messages shown in the error output.

## Conventions

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4.
- UI primitives live in `src/components/ui/` (hand-written shadcn-style; do not use the shadcn CLI).
- Server business logic lives in server actions under `src/lib/actions/`; data fetching in `src/lib/queries/`.
- Auth: username+password login via RPC `get_auth_email_by_username`. Use helpers in `src/lib/helpers.ts` (`getCurrentUser`, `requirePermission`, `requireRole`, `getServerClient`).
- Every authenticated page must call `requirePermission(...)` or `requireRole(...)`.
- No fake/placeholder buttons: every control must work (Loading/Empty/Error states included).
- Do not relax the ESLint rules except for the documented intentional ones in `eslint.config.mjs`.
- Do not add code comments unless the surrounding code already does.

## Environment

Credentials live in `.env.local` (copy from `.env.example`). `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
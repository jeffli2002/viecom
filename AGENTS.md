# Repository Guidelines

## Project Structure & Module Organization
Application code lives in `src/app` (Next.js App Router routes and API handlers), shared UI in `src/components`, feature logic in `src/lib`, and billing logic in `payment` plus `server/actions`. Data access and schema definitions reside under `server/db`, while client state is centralized in `store`. Keep assets such as tailwind tokens in `src/styles`, and place new localization resources in `src/i18n`. Use `env.example` as the canonical reference for required environment variables.

## Build, Test, and Development Commands
- `pnpm dev`: start the Next.js dev server with hot reload; expects a populated `.env`.
- `pnpm build`: production build plus static asset generation; required before deploying or running `pnpm start`.
- `pnpm preview`: smoke-test the production bundle locally (`next build && next start`).
- `pnpm check`: run Biome linting/formatting checks; `pnpm check:write` can auto-fix style issues.
- `pnpm db:migrate`: execute Drizzle migrations against the target database; use `pnpm db:generate` when schema changes.

## Coding Style & Naming Conventions
TypeScript is enforced project-wide with path aliases from `tsconfig.json`. Follow the existing functional-component pattern for UI, keeping server-only utilities in `server` or `lib`. Biome governs formatting (2-space indentation, single quotes where possible); run it before opening a PR. Name files in kebab-case (e.g., `brand-tone-analyzer.ts`), React components in PascalCase, and hooks with the `useSomething` prefix. Favor descriptive folder-level index files for shared exports.

## Testing Guidelines
Jest drives unit and integration suites (`pnpm test`, `pnpm test:unit`, `pnpm test:integration`), while Playwright handles E2E scenarios (`pnpm test:e2e`). Co-locate specs under `tests/unit` or `tests/integration` mirroring the runtime path, using `*.spec.ts(x)` naming. Aim for coverage on pricing-logic, quota enforcement, and payment webhooks; run `pnpm test:coverage` before merging significant backend changes. For browser flows, record failing traces with `pnpm test:e2e --headed` to ease debugging.

## Commit & Pull Request Guidelines
The distributed snapshot lacks Git history, so default to Conventional Commits (`feat(credits): add refund safeguards`) to keep changelogs consistent. Each PR should link the relevant issue, describe risk areas, and include screenshots or GIFs for UI changes plus API samples for backend updates. Note any required migrations (`pnpm db:migrate`) in the PR body and tick off testing steps performed. Small, focused commits make it easier for other agents to bisect regressions.

## Security & Configuration Tips
Never commit secrets; instead, copy `env.example` to `.env.local` and scope API keys per environment. R2, Creem, and DeepSeek credentials should be least-privilege and rotated regularly. When touching webhook or auth code, verify that routes under `src/app/api` still enforce auth guards and input validation via Zod.

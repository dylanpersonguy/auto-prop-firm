# Contributing to Auto Prop Firm

Thank you for your interest in contributing! This project is the world's first open-source, fully autonomous prop trading firm shell powered by Solana smart contracts.

## Getting Started

1. **Fork & clone** the repo
2. Install dependencies: `pnpm install`
3. Copy env files: `cp .env.example .env && cp apps/shell/.env.example apps/shell/.env`
4. Run the dev server: `pnpm dev`

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scopes:** `shell`, `vault`, `sdk`, `admin`, `trading`, `referral`, `payout`

### Examples

```
feat(trading): add candlestick chart with live tick updates
fix(vault): correct Ed25519 signature verification offset
docs(readme): update architecture diagram
refactor(shell): migrate dashboard to TanStack Query
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with conventional commits
3. Ensure `pnpm build` passes with no errors
4. Open a PR with a clear description of what and why

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **Tailwind CSS** — utility-first, dark theme, use brand color tokens
- **Zod** — all API responses validated with Zod schemas
- **React Query** — all data fetching via TanStack Query hooks

## Architecture Decisions

- The Shell is a **BFF (Backend-for-Frontend)** — it never exposes PropSim credentials to the browser
- All trading operations use **idempotency keys** (`crypto.randomUUID()`)
- The Solana vault program uses **Ed25519 signature verification** on-chain
- Payout claims are **signed server-side** and redeemed client-side via wallet

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

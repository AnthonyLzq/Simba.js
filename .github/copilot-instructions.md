# Simba.js agent instructions

## What this repo is
- Simba.js is a Node.js CLI that scaffolds TypeScript backend projects (`bin/index.js` → `lib/index.js` → `lib/src/index.js`).
- The generator writes files, installs deps, runs `prisma generate`, and initializes git for the target project folder.
- Most generated source files are embedded as template strings inside generator modules (not separate template files).

## Core architecture you must preserve
- CLI parsing and interactive mode live in `lib/index.js` (yargs + prompts). Keep option names/aliases aligned with README help text.
- Orchestration is in `lib/src/index.js`; cross-cutting generation happens via `lib/src/functions/*`.
- API generation branches by framework + GraphQL + database in:
  - `lib/src/functions/api/index.js`
  - `lib/src/functions/api/express.js`
  - `lib/src/functions/api/fastify.js`
  - `lib/src/functions/api/{database,schemas,services,utils}.js`
- Generated app structure follows layered boundaries (network, services, database, schemas, utils), described in `README.md` and implemented in the API generator modules.

## High-value workflows
- Run CLI locally: `npm run service` or `npm run service:q`.
- Lint generator source: `npm run lint` (Biome writes fixes), CI mode: `npm run lint:ci`.
- Rebuild all example outputs: `npm run build` (or targeted `build:express:*` / `build:fastify:*`).
- Main regression suite for generator outputs: `npm test`.
  - `npm test` runs build + per-example tests and then `git restore .`.
  - Use `npm run test:local` if you do not want the automatic restore step.
- Integration DB checks are separate: `npm run test:integration`.

## Environment and DB assumptions
- Node.js `>=20` is required (`package.json` engines).
- Root DB scripts and integration tests expect env vars:
  - SQL: `DATABASE_URL`
  - Mongo: `MONGO_URI`
- Generator behavior for `.env` values depends on `NODE_ENV` (`ci`/`local` use external URIs; otherwise defaults are scaffolded) in `lib/src/functions/api/index.js`.

## Project-specific coding conventions
- Generator runtime code is CommonJS (`require`, `module.exports`), while generated app code is TypeScript strings.
- Formatting/linting is Biome-based; prefer existing style: single quotes, no semicolons, 2-space indent.
- Keep changes symmetric across variants; if editing generated behavior, verify impact across:
  - Express vs Fastify
  - REST vs GraphQL
  - Mongo vs SQL databases
- When changing generated package scripts/dependencies/config, update corresponding generator functions (`packageJson.js`, `biome.js`, `tsconfig.js`, `ghat.js`) rather than editing `example/*` directly.

## Practical change strategy for agents
- First edit generator modules in `lib/src/functions/*`.
- Then regenerate affected examples with targeted `npm run build:*` scripts.
- Validate with focused tests for touched examples, then broader `npm test` if needed.
- If docs/CLI flags change, keep `README.md` and `lib/index.js` in sync.
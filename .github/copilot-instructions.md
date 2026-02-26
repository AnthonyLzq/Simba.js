# Simba.js agent instructions

## What this repo is
- Simba.js is a Node.js CLI that scaffolds TypeScript backend projects (`bin/index.js` → `lib/index.js` → `lib/src/index.js`).
- The generator writes files, installs deps, runs `prisma generate`, and initializes git for the target project folder.
- Generated source files are rendered from **EJS templates** in `lib/templates/` via `lib/src/utils/renderTemplate.js`. No inline template strings remain in generator modules.

## Core architecture you must preserve
- CLI parsing and interactive mode live in `lib/index.js` (yargs + prompts). Keep option names/aliases aligned with README help text.
- Orchestration is in `lib/src/index.js`; cross-cutting generation happens via `lib/src/functions/*`.
- API generation branches by framework + GraphQL + database in:
  - `lib/src/functions/api/index.js` — shared entry point, env config, framework dispatch
  - `lib/src/functions/api/express.js` — Express-specific generation (network layer)
  - `lib/src/functions/api/fastify.js` — Fastify-specific generation (network layer)
  - `lib/src/functions/api/{database,schemas,services,utils}.js` — shared across frameworks
- Generated app structure follows layered boundaries (network, services, database, schemas, utils), described in `README.md` and implemented in the API generator modules.

## EJS template system
- All templates live under `lib/templates/` and use the `<%- %>` tag (raw/unescaped output).
- `renderTemplate(templatePath, data)` in `lib/src/utils/renderTemplate.js` resolves paths relative to `lib/templates/`.
- Generator JS files define a local helper `const t = (path, data) => renderTemplate('api/.../' + path, data)` for concise calls.
- Biome ignores `.ejs` files via `.biomeignore` and `overrides` in `biome.json`.
- Template filenames are generic (`entity.ts.ejs`, not `user.ts.ejs`). The generated output filenames are dynamic based on `entityContext`.
- When forEach loops emit delimited items (especially in JSON), use index-guarded commas: `<%= i < arr.length - 1 ? ',' : '' %>`.

## Configurable entity (`--entity` / `-E`)
- The `--entity` flag (default `'User'`) lets users scaffold around any model name.
- `lib/src/utils/entity.js` exports `buildEntityContext(raw)` which returns:
  - `Entity` (PascalCase), `entity` (camelCase), `entities` (plural), `EntitiesPlural` (PascalCase plural)
  - `entityFields` (array of `{ name, zodType, prismaType, tsType, graphQLType }`), `sampleData`, `updateData`, `isDefaultEntity`
- The default entity (`User`) gets fields `lastName` + `name`; custom entities get `name` + `description`.
- `entityContext` is threaded from CLI → orchestration → every generator function → every EJS template. All templates are fully parameterised; no hardcoded `User`/`user`/`users` references remain.
- Uses the `pluralize` package for automatic pluralisation.

## Swagger / OpenAPI documentation
- Both Express and Fastify generate **dynamic OpenAPI specs** from Zod schemas — single source of truth.
- **Express**: Uses `@asteasolutions/zod-to-openapi` with an `OpenAPIRegistry` singleton in `network/utils/`. Each route file imports `registry` and calls `registry.registerPath()` colocated next to each endpoint handler. `docs.ts` generates the spec with `OpenApiGeneratorV31` and serves it via `swagger-ui-express`.
- **Fastify**: Uses `@fastify/swagger` + `fastify-type-provider-zod` with `jsonSchemaTransform`. Schemas are inferred automatically from route definitions.
- Both frameworks read `title`, `version`, `description` from `package.json` at runtime — no build-time `projectVersion` threading needed.
- Express helpers in `network/utils/index.ts`: `jsonResponse(schema, description)` wraps the Simba standard `{ error, message }` response, `jsonBody(schema)` wraps JSON request bodies, `validatorCompiler(schema, 'body'|'params')` provides request validation middleware.
- The `routes/` folder contains **only actual routes** (entity, home, docs, index barrel). All helpers live in `network/utils/`.

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
- Generator runtime code is CommonJS (`require`, `module.exports`), while generated app code is TypeScript rendered from EJS.
- Formatting/linting is Biome-based; prefer existing style: single quotes, no semicolons, 2-space indent.
- Keep changes symmetric across variants; if editing generated behavior, verify impact across:
  - Express vs Fastify
  - REST vs GraphQL
  - Mongo vs SQL databases
- When changing generated package scripts/dependencies/config, update corresponding generator functions (`packageJson.js`, `biome.js`, `tsconfig.js`, `ghat.js`) rather than editing `example/*` directly.
- When changing generated app code, edit the `.ejs` template in `lib/templates/`, not the output in `example/`.

## Practical change strategy for agents
- First edit EJS templates in `lib/templates/` and/or generator modules in `lib/src/functions/*`.
- If adding fields or changing entity shape, update `lib/src/utils/entity.js` (field definitions, sample data).
- Then regenerate affected examples with targeted `npm run build:*` scripts.
- Validate with focused tests for touched examples, then broader `npm test` if needed.
- If docs/CLI flags change, keep `README.md` and `lib/index.js` in sync.
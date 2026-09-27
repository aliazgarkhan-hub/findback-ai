# FindBack AI — Backend export

This folder contains the Express/tRPC backend, Drizzle schema and migrations, storage integration, authentication hooks, matching engine, tests, and server Vite bridge.

## Run

Set the required environment variables through your deployment environment, then:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Important variables include `DATABASE_URL`, `JWT_SECRET`, OAuth variables, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`. Do not commit secrets.

## Build and test

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

The backend exposes the typed tRPC API under `/api/trpc`. The frontend export consumes this API through the complete project’s relative `/api/trpc` client configuration.

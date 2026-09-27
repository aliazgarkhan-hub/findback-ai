# FindBack AI — Frontend export

This folder contains the React + Tailwind frontend source under `client/`, plus the Vite/TypeScript configuration and the shared source contract needed for handoff.

The canonical integrated project remains at the repository root. The frontend’s tRPC client is intentionally kept aligned with the backend router contract; deploy both exports from the same commit or replace the client type import with your generated API contract.

## Run from the canonical project

```bash
pnpm install
pnpm dev
```

The app expects the backend tRPC API at `/api/trpc`. For a separately hosted frontend, configure a reverse proxy or update `client/src/main.tsx` to point `httpBatchLink` at the deployed backend origin.

## Build

```bash
pnpm check
pnpm build
```

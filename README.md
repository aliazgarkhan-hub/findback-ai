# FindBack AI

> Lost something? Let AI help you FindBack.

FindBack AI is a full-stack lost & found platform for colleges, offices, campuses, airports, and other controlled communities. Users report lost or found items, upload a photo, and receive explainable possible matches calculated from the available details.

## Implemented

- Manus OAuth session authentication and logout
- Protected dashboard and report flows
- Durable MySQL/TiDB-backed reports, matches, and messages via Drizzle
- Storage-backed image uploads with MIME, extension, and 5 MB validation
- Required image preview and remove interaction
- Weighted, explainable matching engine for text, category, brand/model, color, distinguishing features, location, and time
- Missing-field rebalance so optional blanks do not unfairly zero a comparison
- Honest image signal: the current demo reports that visual comparison is unavailable rather than inventing a score
- Possible match dashboard with search, status filter, score meter, explanation, factor breakdown, and side-by-side details
- Private in-app contact messages without showing email or phone on item cards
- Real dashboard counts derived from the authenticated user's reports
- Load Demo Data / Clear Demo Data using the same matching engine as normal reports
- Responsive public landing page, app shell, mobile navigation, empty states, loading states, error states, and reduced-motion support
- Accessible labels, focus states, keyboard-friendly native controls, alt text, and live error messaging

## Project structure

```text
client/
  src/App.tsx                 Routes and providers
  src/components/AppShell.tsx Authenticated navigation shell
  src/pages/Home.tsx          Public landing page
  src/pages/Dashboard.tsx     Personal dashboard
  src/pages/ReportPage.tsx    Lost/found report form
  src/pages/MatchesPage.tsx   Match review, details, and messages
  src/index.css               FindBack AI design system
server/
  matching.ts                 Explainable weighted match calculation
  routers.ts                  tRPC API procedures
  db.ts                       Drizzle query helpers
  matching.test.ts            Matching engine tests
drizzle/
  schema.ts                   Users, reports, matches, messages
  migrations/                 Generated schema migration
brand-spec.md                 Brand and design tokens
```

## Requirements

- Node.js 22+
- pnpm 10+
- A configured Manus WebDev environment with `DATABASE_URL`, OAuth environment variables, and built-in storage environment variables

## Run locally

```bash
pnpm install
pnpm db:push
pnpm dev
```

The generated WebDev project starts the server and Vite client together. Open the preview URL printed by the dev server.

## Checks

```bash
pnpm check
pnpm test
pnpm build
```

The current test suite covers auth logout behavior and the match engine's score/explanation behavior.

## Environment variables

The scaffold reads the configured environment through `server/_core/env.ts`. Important values include:

- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

Do not commit `.env` files or secrets. The frontend uses `/api/trpc` so it does not hard-code localhost or API keys.

## Demo flow

1. Sign in using the configured campus/Manus OAuth flow.
2. Open **Overview** and click **Load demo data**.
3. Open **Possible matches**.
4. Select the laptop match to see the two reports side-by-side.
5. Review the calculated score, factor breakdown, and honest image-comparison note.
6. Send a private message from the match detail panel.
7. Use **Clear demo** to remove demo records.

## Deployment

Use the WebDev project checkpoint and publish flow for the configured project. The server is a single Node process and all tRPC requests are relative to the deployed origin. Storage uses the preconfigured Manus Forge/S3 proxy, so image bytes are not stored in the database.

## Honest limitations

- Email/password registration is not duplicated inside the app; authentication is provided by the scaffold's secure Manus OAuth flow.
- The current image comparison architecture stores and serves real uploaded images but does not claim computer-vision similarity. A future vision adapter can add a scored image factor without changing the report or match contracts.
- The demo uses a public image URL for its seeded sample record; user-submitted images use the storage upload path.

import { createTRPCReact } from "@trpc/react-query";

// The integrated project uses the backend's AppRouter type here. The handoff
// export stays backend-agnostic so it can be pointed at a separately deployed
// API; keep this file in sync with the backend contract when changing routes.
export const trpc = createTRPCReact<any>();

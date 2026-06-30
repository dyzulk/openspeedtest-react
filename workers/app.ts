/// <reference types="@cloudflare/workers-types" />
import { createRequestHandler } from "react-router";

declare global {
  interface CloudflareEnvironment extends Env {}
}

// You can add your Cloudflare bindings here (KV, D1, etc.)
interface Env {}

const requestHandler = createRequestHandler(
  // @ts-ignore - resolved by react-router at build time
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    } as any);
  },
} satisfies ExportedHandler<CloudflareEnvironment>;

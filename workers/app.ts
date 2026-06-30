/// <reference types="@cloudflare/workers-types" />
import { createRequestHandler, RouterContextProvider, createContext } from "react-router";

declare global {
  interface CloudflareEnvironment extends Env {}
}

// You can add your Cloudflare bindings here (KV, D1, etc.)
interface Env {}

export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();

const requestHandler = createRequestHandler(
  // @ts-ignore - resolved by react-router at build time
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const routerContext = new RouterContextProvider();
    routerContext.set(cloudflareContext, { env, ctx });
    return requestHandler(request, routerContext);
  },
} satisfies ExportedHandler<CloudflareEnvironment>;

import { createPagesFunctionHandler } from "@react-router/cloudflare";
import { RouterContextProvider, createContext } from "react-router";

// @ts-ignore
import * as build from "../build/server";

export const cloudflareContext = createContext<{
  env: any;
  ctx: any;
}>();

export const onRequest = createPagesFunctionHandler({
  build: build as any,
  getLoadContext(context) {
    const routerContext = new RouterContextProvider();
    routerContext.set(cloudflareContext, {
      env: context.context.cloudflare.env,
      ctx: context.context.cloudflare.ctx,
    });
    return routerContext;
  },
});

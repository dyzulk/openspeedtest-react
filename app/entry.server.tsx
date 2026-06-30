import { isbot } from "isbot";
// @ts-ignore - react-dom/server.browser is the standard import for cloudflare workers runtime
import { renderToReadableStream } from "react-dom/server.browser";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: any
) {
  const userAgent = request.headers.get("user-agent");
  
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: any) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  if (userAgent && isbot(userAgent)) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}

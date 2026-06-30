import type { Route } from "./+types/api.upload";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Content-Length",
  "Access-Control-Max-Age": "86400",
};

export async function loader({ request }: Route.LoaderArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD or GET for Ping / Latency tests
  return new Response(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate, max-age=0",
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Consume the stream chunk-by-chunk to calculate upload throughput without buffering in memory
  if (request.body) {
    const reader = request.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  }

  return new Response(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate, max-age=0",
    },
  });
}

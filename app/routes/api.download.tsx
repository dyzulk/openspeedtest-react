import type { Route } from "./+types/api.download";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function loader({ request }: Route.LoaderArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const totalBytes = 35 * 1024 * 1024; // 35 MB
  const chunkSize = 64 * 1024; // 64 KB
  
  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Length": totalBytes.toString(),
        "Cache-Control": "no-store, no-cache, no-transform, must-revalidate, max-age=0",
      },
    });
  }

  // Pre-generate a 64KB chunk of random bytes to prevent Cloudflare compression
  const chunk = new Uint8Array(chunkSize);
  crypto.getRandomValues(chunk);

  let bytesSent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= totalBytes) {
        controller.close();
        return;
      }

      const remaining = totalBytes - bytesSent;
      const sizeToSend = Math.min(chunkSize, remaining);
      
      if (sizeToSend === chunkSize) {
        controller.enqueue(chunk);
      } else {
        controller.enqueue(chunk.subarray(0, sizeToSend));
      }
      bytesSent += sizeToSend;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/octet-stream",
      "Content-Length": totalBytes.toString(),
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate, max-age=0",
      "Content-Disposition": "attachment; filename=download.bin",
    },
  });
}

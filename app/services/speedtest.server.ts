import { getSpeedTestHeaders } from "@/lib/cors";

const CHUNK_SIZE = 64 * 1024; // 64 KB
const DEFAULT_DOWNLOAD_SIZE = 35 * 1024 * 1024; // 35 MB

// Cache buffer acak untuk mencegah CPU overhead berlebih & kompresi Cloudflare
let cachedChunk: Uint8Array | null = null;
function getRandomChunk(): Uint8Array {
  if (cachedChunk) return cachedChunk;
  cachedChunk = new Uint8Array(CHUNK_SIZE);
  crypto.getRandomValues(cachedChunk);
  return cachedChunk;
}

export async function handleDownloadRequest(request: Request): Promise<Response> {
  const headers = getSpeedTestHeaders({
    "Content-Type": "application/octet-stream",
    "Content-Disposition": "attachment; filename=download.bin",
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  headers.set("Content-Length", DEFAULT_DOWNLOAD_SIZE.toString());

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const chunk = getRandomChunk();
  let bytesSent = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= DEFAULT_DOWNLOAD_SIZE) {
        controller.close();
        return;
      }
      const remaining = DEFAULT_DOWNLOAD_SIZE - bytesSent;
      const sizeToSend = Math.min(CHUNK_SIZE, remaining);
      controller.enqueue(sizeToSend === CHUNK_SIZE ? chunk : chunk.subarray(0, sizeToSend));
      bytesSent += sizeToSend;
    },
  });

  return new Response(stream, { status: 200, headers });
}

export async function handleUploadRequest(request: Request): Promise<Response> {
  const headers = getSpeedTestHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Jika POST/Upload, konsumsi stream untuk hitung throughput
  if (request.method === "POST" && request.body) {
    const reader = request.body.getReader();
    try {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } catch (err) {
      console.error("Upload stream interrupted:", err);
    }
  }

  return new Response(null, { status: 200, headers });
}

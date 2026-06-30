export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Content-Length",
  "Access-Control-Max-Age": "86400",
};

export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, no-transform, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export function getSpeedTestHeaders(extraHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers();
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  Object.entries(NO_CACHE_HEADERS).forEach(([k, v]) => headers.set(k, v));
  Object.entries(extraHeaders).forEach(([k, v]) => headers.set(k, v));
  return headers;
}

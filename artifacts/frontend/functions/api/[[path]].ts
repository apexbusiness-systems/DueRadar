// API_ORIGIN is set as a Cloudflare Pages environment variable so the proxy
// target is environment-driven rather than hardcoded.
// Set it in the Cloudflare Pages dashboard under Settings > Environment variables.
// Example: API_ORIGIN=https://dueradar-api.fly.dev
const API_ORIGIN = (globalThis as unknown as { API_ORIGIN?: string }).API_ORIGIN;

if (!API_ORIGIN) {
  throw new Error(
    "API_ORIGIN environment variable is required. " +
      "Set it in the Cloudflare Pages dashboard under Settings > Environment variables.",
  );
}

function buildUpstreamRequest(inbound: Request, upstreamUrl: URL): Request {
  const headers = new Headers(inbound.headers);
  const sourceUrl = new URL(inbound.url);

  // Ensure upstream host header matches Fly origin to avoid backend host mismatch.
  headers.set("host", upstreamUrl.host);
  // Preserve original edge host/proto for backend logging and auth callback logic.
  headers.set("x-forwarded-host", sourceUrl.host);
  headers.set("x-forwarded-proto", sourceUrl.protocol.replace(":", ""));

  const methodHasBody = !["GET", "HEAD"].includes(inbound.method.toUpperCase());

  return new Request(upstreamUrl.toString(), {
    method: inbound.method,
    headers,
    body: methodHasBody ? inbound.body : undefined,
    redirect: "manual",
  });
}

export const onRequest: PagesFunction<{ API_ORIGIN: string }> = async ({ request, env }) => {
  const origin = env.API_ORIGIN || API_ORIGIN;

  const inboundUrl = new URL(request.url);
  const upstreamUrl = new URL(inboundUrl.pathname + inboundUrl.search, origin);

  const upstreamRequest = buildUpstreamRequest(request, upstreamUrl);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamRequest);
  } catch (err) {
    // Return 502 on upstream connection failure rather than letting an unhandled
    // rejection propagate (which becomes an opaque 500 in Cloudflare Pages).
    console.error("API proxy upstream error:", err);
    return new Response(JSON.stringify({ error: "Bad gateway: upstream unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  // Return upstream response verbatim to preserve status, cookies, and body semantics.
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  });
};

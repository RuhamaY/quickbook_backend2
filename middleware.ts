import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global CORS middleware for the Next.js app.
 *
 * Place this file at the project root so it runs for matched routes.
 *
 * Configuration via env:
 * - CORS_ORIGIN: "*" (default), a single origin, or "auto" to echo request origin.
 * - CORS_ALLOW_CREDENTIALS: "true" to enable Access-Control-Allow-Credentials (only works with a specific origin).
 */

const DEFAULT_ALLOWED_METHODS = "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS";
const DEFAULT_ALLOWED_HEADERS =
  "Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer, User-Agent";

const ORIGIN_ENV = process.env.CORS_ORIGIN || "*";
const ALLOW_CREDENTIALS_ENV = (process.env.CORS_ALLOW_CREDENTIALS || "false").toLowerCase() === "true";

/** Build CORS headers for a request */
function buildCorsHeaders(req: NextRequest) {
  // Resolve origin header to use:
  // - If CORS_ORIGIN === "auto", echo the incoming Origin header (if present)
  // - If CORS_ORIGIN === "*" use wildcard
  // - Otherwise use the configured origin
  const incomingOrigin = req.headers.get("origin");
  let allowOrigin = ORIGIN_ENV;

  if (ORIGIN_ENV === "auto") {
    allowOrigin = incomingOrigin || "*";
  }

  // If wildcard origin and credentials requested, do not set credentials to true (not allowed by CORS)
  const allowCredentials = ALLOW_CREDENTIALS_ENV && allowOrigin !== "*";

  const allowHeaders =
    req.headers.get("access-control-request-headers") || DEFAULT_ALLOWED_HEADERS;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Allow-Credentials": String(allowCredentials),
    "Access-Control-Max-Age": "600", // 10 minutes
  };
}

export function middleware(req: NextRequest) {
  // Preflight handling
  if (req.method === "OPTIONS") {
    const headers = buildCorsHeaders(req);
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  // For non-preflight, attach CORS headers to the response
  const res = NextResponse.next();
  const headers = buildCorsHeaders(req);
  for (const [k, v] of Object.entries(headers)) {
    // NextResponse.headers.set requires string values
    res.headers.set(k, v as string);
  }
  return res;
}

// Only run middleware for API routes and API docs
export const config = {
  matcher: ["/api/:path*", "/api-docs/:path*", "/api-docs", "/swagger/:path*"],
};
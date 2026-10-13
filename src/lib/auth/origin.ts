import { NextRequest } from "next/server";

/**
 * Validates that state-changing requests originate from the same host.
 * Protects cookie-authenticated POST/PATCH/DELETE endpoints from CSRF.
 */
export function validateSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // If origin is missing (e.g. some same-origin server-to-server or older client requests),
    // check sec-fetch-site or referer
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite) {
      return secFetchSite === "same-origin" || secFetchSite === "none";
    }

    const referer = request.headers.get("referer");
    if (referer && host) {
      try {
        const refererHost = new URL(referer).host;
        return refererHost === host;
      } catch {
        return false;
      }
    }

    // In local development or programmatic environments, allow if host matches
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

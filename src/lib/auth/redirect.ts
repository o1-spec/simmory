/**
 * Validates a redirection target path to prevent Open Redirect vulnerabilities.
 * Ensures the destination is strictly an internal, relative application route.
 */
export function sanitizeRedirectUrl(
  destination: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!destination || typeof destination !== "string") {
    return fallback;
  }

  const trimmed = destination.trim();

  // Must begin with a single slash
  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  // Prevent protocol-relative URLs (e.g. //evil.com or //\evil.com)
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Prevent dangerous protocols disguised as relative paths
  if (trimmed.includes(":") && !trimmed.startsWith("/#")) {
    const schemeIndex = trimmed.indexOf(":");
    const slashIndex = trimmed.indexOf("/");
    if (schemeIndex < slashIndex || slashIndex === 0 && trimmed.slice(1).includes(":")) {
      // Check if it's just query param with colon or an actual scheme
      const queryIndex = trimmed.indexOf("?");
      if (queryIndex === -1 || schemeIndex < queryIndex) {
        return fallback;
      }
    }
  }

  return trimmed;
}

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Returns the Authorization header value for OpenRouter.
 * If a BYOK key is provided, use it directly from the client.
 * Otherwise, the server-side env var is used inside API routes.
 */
export function getAuthHeader(byokKey?: string): string {
  const key = byokKey ?? process.env.OPENROUTER_API_KEY ?? "";
  return `Bearer ${key}`;
}

/** Standard headers sent with every OpenRouter request */
export function openrouterHeaders(byokKey?: string): HeadersInit {
  return {
    Authorization: getAuthHeader(byokKey),
    "Content-Type": "application/json",
    "HTTP-Referer": "https://love.ai",
    "X-Title": "Love AI",
  };
}

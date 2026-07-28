const SESSION_TTL_SECONDS = 5 * 60 * 60;
const REVALIDATE_INTERVAL_SECONDS = 10 * 60;
const SESSION_COOKIE_NAME = "fu_session";

export type SessionPayload = {
  userId: string;
  email: string;
  nom: string;
  iat: number;
  exp: number;
  checkedAt: number;
};

function base64UrlEncode(input: Uint8Array): string {
  let binary = "";
  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return base64UrlEncode(new Uint8Array(signature));
}

export function getSessionConfig() {
  const secret = process.env.APP_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("APP_SESSION_SECRET manquant.");
  }
  return {
    secret,
    ttlSeconds: SESSION_TTL_SECONDS,
    cookieName: SESSION_COOKIE_NAME,
  };
}

export async function createSessionToken(user: {
  userId: string;
  email: string;
  nom: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const { secret, ttlSeconds } = getSessionConfig();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId: user.userId,
    email: user.email,
    nom: user.nom,
    iat: now,
    exp: now + ttlSeconds,
    checkedAt: now,
  };
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload, secret);
  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export function needsRevalidation(session: SessionPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const checkedAt = typeof session.checkedAt === "number" ? session.checkedAt : 0;
  return now - checkedAt > REVALIDATE_INTERVAL_SECONDS;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const { secret } = getSessionConfig();
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = await sign(encodedPayload, secret);
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

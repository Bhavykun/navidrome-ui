import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "northstar_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type Session = {
  baseUrl: string;
  username: string;
  password: string;
};

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET configuration");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(session: Session) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decrypt(value: string): Session | null {
  try {
    const payload = Buffer.from(value, "base64url");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const raw = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    const session = JSON.parse(raw) as Session;
    if (!session.baseUrl || !session.username || !session.password) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value ? decrypt(value) : null;
}

export async function setSession(session: Session) {
  (await cookies()).set(SESSION_COOKIE, encrypt(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getNavidromeConfig() {
  const session = await getSession();
  if (session) return session;

  const baseUrl = process.env.NAVIDROME_URL;
  const username = process.env.NAVIDROME_USER;
  const password = process.env.NAVIDROME_PASSWORD;
  if (!baseUrl || !username || !password) {
    throw new Error("Missing Navidrome configuration");
  }
  return { baseUrl, username, password };
}

export { SESSION_COOKIE };

import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "dealchef_session";
const MAX_AGE = 60 * 60 * 24 * 30;
const DEV_SECRET = "dealchef-local-session-secret-change-me";

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  array.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function signature(sessionId: string) {
  const secret = process.env.SESSION_SECRET || DEV_SECRET;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sessionId)));
}

async function isValid(sessionId: string, value: string) {
  const expected = await signature(sessionId);
  const left = fromBase64Url(expected);
  const right = fromBase64Url(value);
  if (left.length !== right.length) return false;
  return left.every((byte, index) => byte === right[index]);
}

export async function readSessionId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;
  const [sessionId, signedValue] = value.split(".");
  if (!sessionId || !signedValue || !(await isValid(sessionId, signedValue))) return null;
  return sessionId;
}

export async function ensureSessionId() {
  const existing = await readSessionId();
  if (existing) return { sessionId: existing, isNew: false };
  const sessionId = crypto.randomUUID();
  await setSessionCookie(sessionId);
  return { sessionId, isNew: true };
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, `${sessionId}.${await signature(sessionId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

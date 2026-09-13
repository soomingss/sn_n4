import crypto from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "shinnong_session";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server environment variables are missing.");
  return { url, key };
}

export async function supabaseAdminFetch(path, options = {}) {
  const { url, key } = config();
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${url}${path}`, { ...options, headers, cache: "no-store" });
}

function sign(encoded) {
  const { key } = config();
  return crypto.createHmac("sha256", key).update(encoded).digest("base64url");
}

export function createSessionToken(userId, remember = true) {
  const now = Math.floor(Date.now() / 1000);
  const ttl = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  const encoded = Buffer.from(JSON.stringify({ uid: userId, exp: now + ttl })).toString("base64url");
  return { token: `${encoded}.${sign(encoded)}`, maxAge: remember ? ttl : undefined };
}

function readSessionToken(token) {
  try {
    const [encoded, signature] = String(token || "").split(".");
    if (!encoded || !signature) return null;
    const expected = sign(encoded);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload?.uid || !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getProfileByUserId(id) {
  if (!id) return null;
  const response = await supabaseAdminFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,username,company_name,contact_name,phone,email,status,role,created_at&limit=1`);
  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}

export async function getCurrentSession() {
  const store = await cookies();
  const payload = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const profile = await getProfileByUserId(payload.uid);
  if (!profile) return null;
  return { user: { id: payload.uid, email: profile.email }, profile };
}

export function sessionCookieName() { return SESSION_COOKIE; }
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/"
};

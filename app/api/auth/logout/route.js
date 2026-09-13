import { NextResponse } from "next/server";
import { authCookieOptions, sessionCookieName } from "../../../lib/auth";
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName(), "", { ...authCookieOptions, maxAge: 0 });
  return response;
}

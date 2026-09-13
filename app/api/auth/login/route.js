import { NextResponse } from "next/server";
import { authCookieOptions, createSessionToken, sessionCookieName, supabaseAdminFetch } from "../../../lib/auth";

export const runtime = "nodejs";
const clean = (v, n = 120) => String(v ?? "").trim().slice(0, n);

export async function POST(request) {
  try {
    const body = await request.json();
    const username = clean(body.username, 60);
    const password = String(body.password ?? "");
    const remember = body.remember !== false;
    if (!username || !password) return NextResponse.json({ message: "아이디와 비밀번호를 입력해 주세요." }, { status: 400 });

    const profileRes = await supabaseAdminFetch(`/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id,email,username,status,role&limit=1`);
    if (!profileRes.ok) return NextResponse.json({ message: "로그인 정보를 확인할 수 없습니다." }, { status: 500 });
    const profile = (await profileRes.json())?.[0];
    if (!profile?.email) return NextResponse.json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });

    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const authRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, password }),
      cache: "no-store"
    });
    if (!authRes.ok) return NextResponse.json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    const auth = await authRes.json();
    if (!auth?.user?.id || auth.user.id !== profile.id) return NextResponse.json({ message: "회원 정보 연결을 확인해 주세요." }, { status: 403 });

    const session = createSessionToken(auth.user.id, remember);
    const response = NextResponse.json({ ok: true, profile: { username: profile.username, status: profile.status, role: profile.role } });
    response.cookies.set(sessionCookieName(), session.token, { ...authCookieOptions, ...(session.maxAge ? { maxAge: session.maxAge } : {}) });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "로그인 중 오류가 발생했습니다." }, { status: 500 });
  }
}

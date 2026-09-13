import { NextResponse } from "next/server";
import { supabaseAdminFetch } from "../../../lib/auth";

export const runtime = "nodejs";
const clean = (value, max = 160) => String(value ?? "").trim().slice(0, max);

function authHeaders(key) {
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function POST(request) {
  let createdUserId = null;
  try {
    const body = await request.json();
    const username = clean(body.username, 60);
    const password = String(body.password ?? "");
    const passwordConfirm = String(body.passwordConfirm ?? "");
    const companyName = clean(body.companyName, 120);
    const contactName = clean(body.contactName, 80);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160).toLowerCase();

    if (!username || !password || !companyName || !contactName || !phone || !email) {
      return NextResponse.json({ message: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
    }
    if (password.length < 8) return NextResponse.json({ message: "비밀번호는 8자 이상 입력해 주세요." }, { status: 400 });
    if (password !== passwordConfirm) return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 400 });

    const usernameCheck = await supabaseAdminFetch(`/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`);
    if (!usernameCheck.ok) return NextResponse.json({ message: "회원 정보를 확인할 수 없습니다." }, { status: 500 });
    if ((await usernameCheck.json())?.length) return NextResponse.json({ message: "이미 사용 중인 아이디입니다." }, { status: 409 });

    const emailCheck = await supabaseAdminFetch(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
    if (!emailCheck.ok) return NextResponse.json({ message: "회원 정보를 확인할 수 없습니다." }, { status: 500 });
    if ((await emailCheck.json())?.length) return NextResponse.json({ message: "이미 등록된 이메일입니다." }, { status: 409 });

    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase server environment variables are missing.");

    const authRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: authHeaders(key),
      body: JSON.stringify({ email, password, email_confirm: true }),
      cache: "no-store"
    });
    const authData = await authRes.json().catch(() => ({}));
    if (!authRes.ok) {
      const text = String(authData?.msg || authData?.message || "").toLowerCase();
      if (text.includes("already") || text.includes("registered")) return NextResponse.json({ message: "이미 등록된 이메일입니다." }, { status: 409 });
      console.error("Signup auth error:", authData);
      return NextResponse.json({ message: "회원 계정을 생성할 수 없습니다." }, { status: 500 });
    }

    createdUserId = authData?.id || authData?.user?.id;
    if (!createdUserId) throw new Error("Auth user id was not returned.");

    const profileRes = await supabaseAdminFetch("/rest/v1/profiles", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id: createdUserId,
        username,
        company_name: companyName,
        contact_name: contactName,
        phone,
        email,
        status: "pending",
        role: "customer"
      })
    });

    if (!profileRes.ok) {
      const detail = await profileRes.text();
      console.error("Signup profile error:", detail);
      await fetch(`${url}/auth/v1/admin/users/${createdUserId}`, { method: "DELETE", headers: authHeaders(key), cache: "no-store" }).catch(() => {});
      return NextResponse.json({ message: "회원 정보를 저장할 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "회원가입 신청 중 오류가 발생했습니다." }, { status: 500 });
  }
}

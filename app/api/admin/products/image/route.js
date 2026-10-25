import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../../lib/auth";

export const runtime = "nodejs";
const BUCKET = "product-images";
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function imageType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return ["image/png", "png"];
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ["image/jpeg", "jpg"];
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return ["image/webp", "webp"];
  return null;
}

export async function POST(request) {
  if ((await getCurrentSession())?.profile?.role !== "admin") return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_BYTES + 65536) return NextResponse.json({ message: "사진은 3MB 이하로 선택해 주세요." }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return NextResponse.json({ message: "업로드할 사진을 선택해 주세요." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ message: "사진은 3MB 이하로 선택해 주세요." }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const detected = imageType(bytes);
    if (!detected || (file.type && file.type !== detected[0])) return NextResponse.json({ message: "JPG, PNG, WebP 사진만 업로드할 수 있습니다." }, { status: 400 });

    let bucket = await supabaseAdminFetch(`/storage/v1/bucket/${BUCKET}`);
    if (!bucket.ok) {
      const error = await bucket.json().catch(() => ({}));
      if (bucket.status !== 404 && String(error.statusCode) !== "404") throw new Error("storage bucket lookup failed");
      const created = await supabaseAdminFetch("/storage/v1/bucket", { method: "POST", body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: TYPES }) });
      // Another administrator may create the same bucket concurrently.
      if (!created.ok && created.status !== 409) throw new Error("storage bucket creation failed");
      bucket = await supabaseAdminFetch(`/storage/v1/bucket/${BUCKET}`);
    }
    if (!bucket.ok || !(await bucket.json()).public) throw new Error("public product image bucket unavailable");
    const path = `${crypto.randomUUID()}.${detected[1]}`;
    const upload = await supabaseAdminFetch(`/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { "Content-Type": detected[0], "Cache-Control": "public, max-age=31536000" }, body: bytes });
    if (!upload.ok) throw new Error("storage upload failed");
    const origin = process.env.SUPABASE_URL?.replace(/\/$/, "");
    return NextResponse.json({ image_url: `${origin}/storage/v1/object/public/${BUCKET}/${path}` });
  } catch (error) {
    console.error("[product-image]", error.message);
    return NextResponse.json({ message: "사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}

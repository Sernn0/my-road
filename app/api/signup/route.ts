import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/auth/current-user";
import { createServerSupabase } from "@/lib/supabase/server";

// 더미 회원가입: 닉네임만 받아 새 더미 계정을 만든다. 이름·이메일·비밀번호는 받지 않는다. (PRD 6번)
// 요청: { nickname } / 응답: 성공 { data: { id, nickname } }, 실패 { error: { code, message } }
const MAX_NICKNAME = 12;

export async function POST(request: Request) {
  let body: { nickname?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_JSON", message: "요청 형식이 올바르지 않습니다" } }, { status: 400 });
  }
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (!nickname || nickname.length > MAX_NICKNAME) {
    return Response.json(
      { error: { code: "INVALID_NICKNAME", message: `닉네임은 1~${MAX_NICKNAME}자로 적어 주세요` } },
      { status: 400 },
    );
  }
  const { data, error } = await createServerSupabase().from("users").insert({ nickname }).select("id, nickname").single();
  if (error) {
    return Response.json({ error: { code: "SIGNUP_FAILED", message: "가입하지 못했습니다" } }, { status: 500 });
  }
  (await cookies()).set(USER_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ data }, { status: 201 });
}

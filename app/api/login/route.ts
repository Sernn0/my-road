import { cookies } from "next/headers";
import { TEST_ACCOUNT_IDS, UUID, USER_COOKIE } from "@/lib/auth/current-user";
import { createServerSupabase } from "@/lib/supabase/server";

// 더미 로그인: 고른 더미 계정 번호를 쿠키에 기억한다. 비밀번호는 받지 않는다. (PRD 6번)
// 요청: { userId } / 응답: 성공 { data: { id, nickname } }, 실패 { error: { code, message } }
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production", // 배포(https)에서는 암호화된 연결로만 쿠키를 보낸다
};

export async function POST(request: Request) {
  let body: { userId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_JSON", message: "요청 형식이 올바르지 않습니다" } }, { status: 400 });
  }
  // MVP는 테스트 계정 3개로만 시연한다. 그 밖의 계정 번호로는 로그인할 수 없다
  if (typeof body.userId !== "string" || !UUID.test(body.userId) || !TEST_ACCOUNT_IDS.includes(body.userId)) {
    return Response.json({ error: { code: "INVALID_USER", message: "계정 번호가 올바르지 않습니다" } }, { status: 400 });
  }
  const { data } = await createServerSupabase().from("users").select("id, nickname").eq("id", body.userId).maybeSingle();
  if (!data) {
    return Response.json({ error: { code: "NOT_FOUND", message: "계정을 찾을 수 없습니다" } }, { status: 404 });
  }
  (await cookies()).set(USER_COOKIE, data.id, COOKIE_OPTIONS);
  return Response.json({ data });
}

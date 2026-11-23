import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/auth/current-user";

// 로그아웃: 기억해 둔 더미 계정 쿠키를 지운다.
export async function POST() {
  (await cookies()).delete(USER_COOKIE);
  return Response.json({ data: { ok: true } });
}

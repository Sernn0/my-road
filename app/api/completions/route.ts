import { getCurrentUserId } from "@/lib/auth/current-user";
import { createServerSupabase } from "@/lib/supabase/server";

// 완주 요약 저장 (PLAN 16번, DESIGN.md 5번). 이동 경로·위치는 받지도 저장하지도 않는다. (PRD 7번)
// 요청: { courseId, durationSec } / 응답: 성공 { data: { id } }, 실패 { error: { code, message } }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return fail(401, "LOGIN_REQUIRED", "로그인이 필요합니다");
  let body: { courseId?: unknown; durationSec?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다");
  }
  const { courseId, durationSec } = body;
  if (typeof courseId !== "string" || !UUID.test(courseId)) {
    return fail(400, "INVALID_COURSE", "코스 번호가 올바르지 않습니다");
  }
  if (typeof durationSec !== "number" || !Number.isInteger(durationSec) || durationSec < 1 || durationSec > 86400) {
    return fail(400, "INVALID_DURATION", "소요 시간이 올바르지 않습니다");
  }

  const supabase = createServerSupabase();
  // 거리는 화면 값을 믿지 않고 코스의 길이를 쓴다
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("distance_km")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (courseError) return fail(500, "SAVE_FAILED", "완주 기록을 저장하지 못했습니다");
  if (!course) return fail(404, "NOT_FOUND", "코스를 찾을 수 없습니다");

  const { data, error } = await supabase
    .from("completions")
    .insert({
      user_id: userId,
      course_id: courseId,
      duration_sec: durationSec,
      distance_km: course.distance_km,
      xp: 0, // 경험치는 nice 기능에서 채운다
    })
    .select("id")
    .single();
  if (error) return fail(500, "SAVE_FAILED", "완주 기록을 저장하지 못했습니다");
  return Response.json({ data }, { status: 201 });
}

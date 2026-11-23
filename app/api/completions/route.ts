import { getCurrentUser } from "@/lib/auth/current-user";
import { calcXp } from "@/lib/progress/level";
import { addDays, kstDate, nextStreak } from "@/lib/progress/streak";
import { createServerSupabase } from "@/lib/supabase/server";

// 완주 요약 저장 + 경험치·streak 갱신 (PLAN 16·18·19번, DESIGN.md 5번).
// 이동 경로·위치는 받지도 저장하지도 않는다. (PRD 7번)
// 요청: { courseId, durationSec } / 응답: 성공 { data: { id, xp, streak } }, 실패 { error: { code, message } }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "LOGIN_REQUIRED", "로그인이 필요합니다");

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
  // 거리는 화면 값을 믿지 않고 코스의 길이를 쓴다. 경험치도 코스 길이 기준이다.
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("distance_km")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (courseError) return fail(500, "SAVE_FAILED", "완주 기록을 저장하지 못했습니다");
  if (!course) return fail(404, "NOT_FOUND", "코스를 찾을 수 없습니다");

  // 연속 달성: 한국 시간 오늘 기준 (자정을 넘겨 끝난 운동은 완주를 마친 시각의 날짜로 센다)
  const today = kstDate();
  const streak = nextStreak(user, today);

  // 같은 코스는 하루 1회만 경험치를 인정한다. 두 번째부터는 기록은 남기되 경험치는 0
  const todayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const tomorrowStart = new Date(`${addDays(today, 1)}T00:00:00+09:00`).toISOString();
  const { count, error: countError } = await supabase
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .gte("completed_at", todayStart)
    .lt("completed_at", tomorrowStart);
  if (countError) return fail(500, "SAVE_FAILED", "완주 기록을 저장하지 못했습니다");
  const xp = (count ?? 0) > 0 ? 0 : calcXp(Number(course.distance_km), streak);

  const { data, error } = await supabase
    .from("completions")
    .insert({ user_id: user.id, course_id: courseId, duration_sec: durationSec, distance_km: course.distance_km, xp })
    .select("id")
    .single();
  if (error) return fail(500, "SAVE_FAILED", "완주 기록을 저장하지 못했습니다");

  const { error: updateError } = await supabase
    .from("users")
    .update({ total_xp: user.totalXp + xp, streak_count: streak, last_goal_date: today })
    .eq("id", user.id);
  if (updateError) return fail(500, "SAVE_FAILED", "경험치를 반영하지 못했습니다");

  return Response.json({ data: { id: data.id, xp, streak } }, { status: 201 });
}

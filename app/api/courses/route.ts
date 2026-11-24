import { MAX_COURSES_PER_USER, validateCourseInput } from "@/lib/courses/validate";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createServerSupabase } from "@/lib/supabase/server";

// 코스 저장 (DESIGN.md 5번). 응답 형식: 성공 { data }, 실패 { error: { code, message } }
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json({ error: { code: "LOGIN_REQUIRED", message: "로그인이 필요합니다" } }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_JSON", message: "요청 형식이 올바르지 않습니다" } }, { status: 400 });
  }

  const result = validateCourseInput(body);
  if (!result.ok) {
    return Response.json({ error: { code: result.code, message: result.message } }, { status: 400 });
  }

  const supabase = createServerSupabase();
  // 계정당 코스 수 제한 (요청을 반복해 DB를 채우는 것을 막는다)
  const { count } = await supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) >= MAX_COURSES_PER_USER) {
    return Response.json({ error: { code: "TOO_MANY", message: `코스는 ${MAX_COURSES_PER_USER}개까지 저장할 수 있어요` } }, { status: 409 });
  }

  const start = result.path[0];
  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      name: result.name,
      path: result.path,
      distance_km: result.distanceKm,
      start_lat: start[0],
      start_lng: start[1],
    })
    .select("id, name, distance_km")
    .single();

  if (error) {
    return Response.json({ error: { code: "SAVE_FAILED", message: "코스를 저장하지 못했습니다" } }, { status: 500 });
  }
  return Response.json({ data }, { status: 201 });
}

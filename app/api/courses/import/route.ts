import { getCurrentUserId } from "@/lib/auth/current-user";
import { parseShareInput } from "@/lib/courses/share-code";
import { MAX_COURSES_PER_USER } from "@/lib/courses/validate";
import { createServerSupabase } from "@/lib/supabase/server";

// 공유 코드로 코스 추가: 공유 코드(6자리)나 공유 링크를 받아, 그 코스를 복사해 내 코스로 저장한다.
// 요청: { code } / 응답: 성공 { data: { id, name } }, 실패 { error: { code, message } }
function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return fail(401, "LOGIN_REQUIRED", "로그인이 필요합니다");

  let body: { code?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다");
  }
  const parsed = typeof body.code === "string" ? parseShareInput(body.code) : null;
  if (!parsed) return fail(400, "INVALID_CODE", "공유 코드 6자리나 공유 링크를 넣어 주세요");

  const supabase = createServerSupabase();
  const base = supabase.from("courses").select("user_id, name, path, distance_km, start_lat, start_lng, is_demo");
  const { data: course, error } = await ("code" in parsed
    ? base.eq("share_code", parsed.code)
    : base.eq("id", parsed.id).not("share_code", "is", null) // 링크로 가져올 때도 주인이 공유한 코스만
  ).maybeSingle();
  if (error) return fail(500, "IMPORT_FAILED", "코스를 추가하지 못했습니다");
  if (!course) return fail(404, "NOT_FOUND", "이 코드의 코스를 찾을 수 없어요");
  if (course.is_demo) return fail(409, "ALREADY_LISTED", "시연 코스는 이미 목록에 있어요");
  if (course.user_id === userId) return fail(409, "ALREADY_MINE", "이미 내 코스예요");

  // 계정당 코스 수 제한 (같은 코스를 반복해서 가져와 DB를 채우는 것을 막는다)
  const { count } = await supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) >= MAX_COURSES_PER_USER) return fail(409, "TOO_MANY", `코스는 ${MAX_COURSES_PER_USER}개까지 저장할 수 있어요`);

  const { data, error: insertError } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      name: course.name,
      path: course.path,
      distance_km: course.distance_km,
      start_lat: course.start_lat,
      start_lng: course.start_lng,
    })
    .select("id, name")
    .single();
  if (insertError) return fail(500, "IMPORT_FAILED", "코스를 추가하지 못했습니다");
  return Response.json({ data }, { status: 201 });
}

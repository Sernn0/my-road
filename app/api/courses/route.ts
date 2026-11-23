import { validateCourseInput } from "@/lib/courses/validate";
import { createServerSupabase, DUMMY_USER_ID } from "@/lib/supabase/server";

// 코스 저장 (DESIGN.md 5번). 응답 형식: 성공 { data }, 실패 { error: { code, message } }
export async function POST(request: Request) {
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

  const start = result.path[0];
  const { data, error } = await createServerSupabase()
    .from("courses")
    .insert({
      user_id: DUMMY_USER_ID,
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

import { MAX_NAME_LENGTH } from "@/lib/courses/validate";
import { createServerSupabase, DUMMY_USER_ID } from "@/lib/supabase/server";

// 코스 이름 변경(PATCH)과 삭제(DELETE). 응답 형식: 성공 { data }, 실패 { error: { code, message } }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/courses/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return fail(400, "INVALID_ID", "코스 번호가 올바르지 않습니다");

  let body: { name?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다");
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return fail(400, "INVALID_NAME", `코스 이름은 1~${MAX_NAME_LENGTH}자로 적어 주세요`);
  }

  const { data, error } = await createServerSupabase()
    .from("courses")
    .update({ name })
    .eq("id", id)
    .eq("user_id", DUMMY_USER_ID)
    .select("id, name")
    .maybeSingle();
  if (error) return fail(500, "UPDATE_FAILED", "이름을 바꾸지 못했습니다");
  if (!data) return fail(404, "NOT_FOUND", "코스를 찾을 수 없습니다");
  return Response.json({ data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/courses/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return fail(400, "INVALID_ID", "코스 번호가 올바르지 않습니다");

  const { data, error } = await createServerSupabase()
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("user_id", DUMMY_USER_ID)
    .select("id")
    .maybeSingle();
  if (error) return fail(500, "DELETE_FAILED", "코스를 삭제하지 못했습니다");
  if (!data) return fail(404, "NOT_FOUND", "코스를 찾을 수 없습니다");
  return Response.json({ data });
}

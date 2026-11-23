import { getCurrentUserId, UUID } from "@/lib/auth/current-user";
import { makeShareCode } from "@/lib/courses/share-code";
import { createServerSupabase } from "@/lib/supabase/server";

// 공유 코드 받기 (PLAN 20번 확장): 코스의 6자리 공유 코드를 돌려준다. 처음이면 새로 만든다.
// 내 코스나 시연용 샘플 코스만 공유할 수 있다. 응답: { data: { code } } / { error: { code, message } }
function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(_request: Request, ctx: RouteContext<"/api/courses/[id]/share">) {
  const userId = await getCurrentUserId();
  if (!userId) return fail(401, "LOGIN_REQUIRED", "로그인이 필요합니다");
  const { id } = await ctx.params;
  if (!UUID.test(id)) return fail(400, "INVALID_ID", "코스 번호가 올바르지 않습니다");

  const supabase = createServerSupabase();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, share_code")
    .eq("id", id)
    .or(`user_id.eq.${userId},is_demo.eq.true`)
    .maybeSingle();
  if (error) return fail(500, "SHARE_FAILED", "공유 코드를 만들지 못했습니다");
  if (!course) return fail(404, "NOT_FOUND", "코스를 찾을 수 없습니다");
  if (course.share_code) return Response.json({ data: { code: course.share_code } });

  // 코드가 겹치면(아주 드묾) 다시 만든다
  for (let i = 0; i < 5; i++) {
    const code = makeShareCode();
    const { data, error: updateError } = await supabase
      .from("courses")
      .update({ share_code: code })
      .eq("id", id)
      .is("share_code", null)
      .select("share_code")
      .maybeSingle();
    if (!updateError && data) return Response.json({ data: { code: data.share_code } });
    if (!updateError && !data) {
      // 그 사이에 다른 요청이 먼저 만들었다
      const { data: again } = await supabase.from("courses").select("share_code").eq("id", id).maybeSingle();
      if (again?.share_code) return Response.json({ data: { code: again.share_code } });
    }
  }
  return fail(500, "SHARE_FAILED", "공유 코드를 만들지 못했습니다");
}

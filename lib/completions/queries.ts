import "server-only";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createServerSupabase } from "@/lib/supabase/server";

export type CompletionSummary = {
  id: string;
  courseName: string;
  completedAt: string; // ISO
  durationSec: number;
  distanceKm: number;
  xp: number; // 이번 완주로 받은 경험치
  coursePath: [number, number][] | null; // 코스 모양 (저장된 코스 경로. 실제로 달린 궤적이 아니다)
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 완주 요약 한 개 (코스, 날짜, 소요 시간, 거리). 없으면 null.
export async function getCompletion(id: string): Promise<CompletionSummary | null> {
  const userId = await getCurrentUserId();
  if (!userId || !UUID.test(id)) return null;
  const { data, error } = await createServerSupabase()
    .from("completions")
    .select("id, completed_at, duration_sec, distance_km, xp, courses(name, path)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("완주 기록을 불러오지 못했습니다");
  if (!data) return null;
  type CourseRow = { name: string; path: [number, number][] | null };
  const joined = data.courses as unknown as CourseRow | CourseRow[] | null;
  const course = Array.isArray(joined) ? joined[0] : joined;
  return {
    id: data.id as string,
    courseName: course?.name ?? "삭제된 코스",
    completedAt: data.completed_at as string,
    durationSec: data.duration_sec as number,
    distanceKm: Number(data.distance_km),
    xp: data.xp as number,
    coursePath: course?.path ?? null,
  };
}

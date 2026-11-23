import "server-only";
import type { Course } from "@/lib/types";
import { createServerSupabase, DUMMY_USER_ID } from "@/lib/supabase/server";

// 내 코스 목록 (최근에 만든 것부터). 목록은 user_id로 걸러 내 코스만 보여 준다. (DESIGN.md 4번)
export async function listCourses(): Promise<Course[]> {
  const { data, error } = await createServerSupabase()
    .from("courses")
    .select("id, name, distance_km")
    .eq("user_id", DUMMY_USER_ID)
    .order("created_at", { ascending: false });
  if (error) throw new Error("코스 목록을 불러오지 못했습니다");
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    distanceKm: Number(row.distance_km),
  }));
}

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

export type CourseDetail = Course & {
  path: [number, number][]; // [위도, 경도] 점 목록
  startLat: number;
  startLng: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 코스 한 개 (경로 포함). 없거나 번호 형식이 틀리면 null.
export async function getCourse(id: string): Promise<CourseDetail | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await createServerSupabase()
    .from("courses")
    .select("id, name, distance_km, path, start_lat, start_lng")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("코스를 불러오지 못했습니다");
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    distanceKm: Number(data.distance_km),
    path: data.path as [number, number][],
    startLat: data.start_lat as number,
    startLng: data.start_lng as number,
  };
}

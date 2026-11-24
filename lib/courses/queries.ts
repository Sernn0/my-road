import "server-only";
import { isCourseDisabled } from "@/lib/courses/availability";
import { courseThumbnail } from "@/lib/geo/thumbnail";
import { thumbBasemap } from "@/lib/map/thumb-basemap";
import type { Course } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

// 내 코스 목록 (최근에 만든 것부터). 목록은 user_id로 걸러 내 코스만 보여 준다. (DESIGN.md 4번)
// 시연 모드(NEXT_PUBLIC_DEMO_MODE=true)에서는 시연용 샘플 코스도 모든 계정의 목록에 함께 보여 준다.
export async function listCourses(userId: string): Promise<Course[]> {
  const query = createServerSupabase().from("courses").select("id, name, distance_km, is_demo, path");
  const { data, error } = await (process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    ? query.or(`user_id.eq.${userId},is_demo.eq.true`)
    : query.eq("user_id", userId)
  ).order("created_at", { ascending: false });
  if (error) throw new Error("코스 목록을 불러오지 못했습니다");
  const courses = await Promise.all(
    (data ?? []).map(async (row) => {
      const path = row.path as [number, number][];
      const thumbnail = courseThumbnail(path);
      // 썸네일 바탕 지도 (아주 간략하게: 큰 길·물·공원). 실패하면 경로만 보인다.
      const basemap = thumbnail ? await thumbBasemap(`${row.id}:${row.distance_km}`, path) : null;
      return {
        id: row.id as string,
        name: row.name as string,
        distanceKm: Number(row.distance_km),
        isDemo: row.is_demo as boolean,
        thumbnail: thumbnail ? { ...thumbnail, basemap } : null,
        disabled: isCourseDisabled(path),
      };
    }),
  );
  // 지금 고를 수 없는 코스(순환 코스 임시 비활성화)는 맨 아래로 보낸다. 나머지 순서는 그대로
  return [...courses.filter((c) => !c.disabled), ...courses.filter((c) => c.disabled)];
}

export type CourseDetail = Course & {
  path: [number, number][]; // [위도, 경도] 점 목록
  startLat: number;
  startLng: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 코스 한 개 (경로 포함). 볼 수 있는 코스만 돌려준다: 내 코스, 시연용 샘플 코스, 주인이 공유한 코스(공유 코드가 있음).
// 공유하지 않은 남의 코스는 번호를 알아도 보이지 않는다. 없거나 번호 형식이 틀리면 null.
export async function getCourse(id: string, userId: string | null): Promise<CourseDetail | null> {
  if (!UUID.test(id) || (userId !== null && !UUID.test(userId))) return null;
  const visible = userId ? `user_id.eq.${userId},is_demo.eq.true,share_code.not.is.null` : "is_demo.eq.true,share_code.not.is.null";
  const { data, error } = await createServerSupabase()
    .from("courses")
    .select("id, name, distance_km, path, start_lat, start_lng, is_demo")
    .eq("id", id)
    .or(visible)
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
    isDemo: data.is_demo as boolean,
    disabled: isCourseDisabled(data.path as [number, number][]),
  };
}

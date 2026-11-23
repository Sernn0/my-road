import "server-only";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

// 더미 로그인 (PLAN 17번). 실제 인증이 아니라, 고른 더미 계정 번호를 쿠키에 기억해 두는 것뿐이다. (PRD 6번)
export const USER_COOKIE = "myroad_user";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UserProfile = {
  id: string;
  nickname: string;
  totalXp: number;
  streakCount: number;
  lastGoalDate: string | null; // YYYY-MM-DD (한국 시간 기준 날짜)
};

type UserRow = {
  id: string;
  nickname: string;
  total_xp: number;
  streak_count: number;
  last_goal_date: string | null;
};

export function toProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    totalXp: row.total_xp,
    streakCount: row.streak_count,
    lastGoalDate: row.last_goal_date,
  };
}

export const USER_COLUMNS = "id, nickname, total_xp, streak_count, last_goal_date";

// 로그인한 사용자. 로그인하지 않았거나 계정이 없으면 null.
export async function getCurrentUser(): Promise<UserProfile | null> {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  if (!id || !UUID.test(id)) return null;
  const { data } = await createServerSupabase().from("users").select(USER_COLUMNS).eq("id", id).maybeSingle();
  return data ? toProfile(data as UserRow) : null;
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}

// 시연에 쓰는 테스트 계정 3개 (MVP는 이 계정들로만 시연한다)
export const TEST_ACCOUNT_IDS = [
  "00000000-0000-0000-0000-000000000001",
  "00000000-0000-0000-0000-000000000002",
  "00000000-0000-0000-0000-000000000003",
];

// 로그인 화면에 보여 줄 테스트 계정 목록
export async function listUsers(): Promise<UserProfile[]> {
  const { data, error } = await createServerSupabase()
    .from("users")
    .select(USER_COLUMNS)
    .in("id", TEST_ACCOUNT_IDS)
    .order("id", { ascending: true });
  if (error) throw new Error("계정 목록을 불러오지 못했습니다");
  return (data as UserRow[]).map(toProfile);
}

import "server-only"; // 이 파일을 브라우저 코드에서 가져오면 빌드가 막힌다 (서버 키 보호)
import { createClient } from "@supabase/supabase-js";

// 서버 전용 Supabase 연결. 서버 키는 .env에서만 읽고 NEXT_PUBLIC_을 붙이지 않는다. (DESIGN.md 5번)
export function createServerSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// 이번 버전은 더미 로그인이라 사용자 1명을 고정해서 쓴다. (supabase/migrations 참고)
export const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001";

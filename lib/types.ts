import type { Thumbnail } from "@/lib/geo/thumbnail";

// 코스 한 개의 목록용 정보 (DESIGN.md 4번 courses 테이블 중 목록에 필요한 칸)
export type Course = {
  id: string; // UUID
  name: string;
  distanceKm: number; // 저장은 원래 값, 화면에는 formatDistanceKm으로 소수 첫째 자리만 보여 준다
  isDemo?: boolean; // 시연용 샘플 코스 (모든 계정에 보이고 이름 변경·삭제는 할 수 없다)
  thumbnail?: Thumbnail | null; // 코스 모양 썸네일
  disabled?: boolean; // 지금은 고를 수 없는 코스 (순환 코스 임시 비활성화, lib/courses/availability.ts)
};

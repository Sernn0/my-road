// 코스 한 개의 목록용 정보 (DESIGN.md 4번 courses 테이블 중 목록에 필요한 칸)
export type Course = {
  id: string; // UUID
  name: string;
  distanceKm: number; // 저장은 원래 값, 화면에는 formatDistanceKm으로 소수 첫째 자리만 보여 준다
};

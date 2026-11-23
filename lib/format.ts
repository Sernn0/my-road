// 거리는 km 단위, 소수점 첫째 자리까지 표시한다. (PRD 5번 규칙)
export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)}km`;
}

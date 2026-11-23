// 거리는 km 단위, 소수점 첫째 자리까지 표시한다. (PRD 5번 규칙)
export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)}km`;
}

// 소요 시간(초) → "mm:ss" 또는 "h:mm:ss"
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

// 한국 시간 기준 날짜 (예: 2026년 11월 23일)
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

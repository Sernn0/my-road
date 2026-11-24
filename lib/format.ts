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

// 평균 페이스: 1km당 걸린 시간 (예: 6'05")
export function formatPace(secPerKm: number): string {
  const total = Math.round(secPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

// 한국 시간 기준 날짜와 시각 (예: 2026.11.24 (화) 오후 7:42)
export function formatDateTime(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}.${parts.month}.${parts.day} (${parts.weekday}) ${parts.dayPeriod} ${parts.hour}:${parts.minute}`;
}

// 한국 시간 기준 짧은 날짜 (예: 11월 20일)
export function formatMonthDay(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" }).format(new Date(iso));
}

// 초 → "12초" 또는 "1분 5초" (최고 기록과의 차이 표시용)
export function formatGap(sec: number): string {
  const s = Math.round(Math.abs(sec));
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분${s % 60 ? ` ${s % 60}초` : ""}`;
}

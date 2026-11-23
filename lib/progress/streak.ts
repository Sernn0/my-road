// 연속 목표 달성(streak) 계산 (PLAN 19번, PRD 5번).
// 하루는 한국 시간 00:00~24:00이고, 그날 완주를 1번 이상 하면 달성이다. 하루라도 거르면 0부터 다시 센다.
// 날짜는 "YYYY-MM-DD" 문자열(한국 시간 기준)로 다룬다.

const DAY_MS = 86_400_000;

// 지금(또는 주어진 시각)의 한국 시간 날짜
export function kstDate(at: Date | number = Date.now()): string {
  return new Date(new Date(at).getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

// 날짜에 일수를 더한다 (음수면 뺀다)
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

type StreakState = { streakCount: number; lastGoalDate: string | null };

// 화면에 보여 줄 연속 일수: 마지막 달성일이 오늘이나 어제가 아니면 이미 끊긴 것이므로 0
export function effectiveStreak(user: StreakState, today: string): number {
  if (!user.lastGoalDate) return 0;
  return user.lastGoalDate === today || user.lastGoalDate === addDays(today, -1) ? user.streakCount : 0;
}

// 오늘 완주했을 때의 새 연속 일수
// - 오늘 이미 달성했다면 그대로, 어제 달성했다면 +1, 그 외에는 1부터 다시 시작
// 자정을 넘겨 끝난 운동은 완주를 마친 시각의 날짜(today)로 센다.
export function nextStreak(user: StreakState, today: string): number {
  if (user.lastGoalDate === today) return Math.max(1, user.streakCount);
  if (user.lastGoalDate === addDays(today, -1)) return user.streakCount + 1;
  return 1;
}

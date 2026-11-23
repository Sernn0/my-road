import { levelInfo } from "./level";
import { effectiveStreak, kstDate } from "./streak";

type ProgressUser = { totalXp: number; streakCount: number; lastGoalDate: string | null };

// 한 줄 요약: "페이스메이커 2/4 · 연속 5일" (최고 레벨을 모두 채우면 "로드 레전드 · 최고 레벨")
export function describeProgress(user: ProgressUser): string {
  const info = levelInfo(user.totalXp);
  const streak = effectiveStreak(user, kstDate());
  const level = info.maxed ? `${info.title} · 최고 레벨` : `${info.title} ${info.section}/${info.sectionCount}`;
  return `${level} · ${streak > 0 ? `연속 ${streak}일` : "연속 기록 없음"}`;
}

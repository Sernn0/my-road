import { Flame, LevelBadge } from "@/components/icons";
import { levelInfo } from "@/lib/progress/level";
import { effectiveStreak, kstDate } from "@/lib/progress/streak";

type StatsUser = { totalXp: number; streakCount: number; lastGoalDate: string | null };

// 레벨명(왼쪽에 레벨 뱃지)과 연속 달성(왼쪽에 불꽃)을 보여 준다.
// layout="stack"은 두 줄(로그인 화면), "inline"은 한 줄(메인 화면 위쪽)
export default function UserStats({ user, layout = "stack" }: { user: StatsUser; layout?: "stack" | "inline" }) {
  const info = levelInfo(user.totalXp);
  const streak = effectiveStreak(user, kstDate());
  const level = (
    <span className="flex items-center gap-1">
      <LevelBadge level={info.level} />
      <span>{info.title}</span>
    </span>
  );
  const fire = (
    <span className="flex items-center gap-1" aria-label={`연속 달성 ${streak}일`}>
      <Flame active={streak > 0} />
      <span>{streak > 0 ? `${streak}일` : "0일"}</span>
    </span>
  );
  return layout === "stack" ? (
    <div className="flex flex-col items-center gap-1 text-sm text-foreground/80">
      {level}
      {fire}
    </div>
  ) : (
    <div className="flex items-center justify-center gap-3 text-xs text-foreground/70">
      {level}
      {fire}
    </div>
  );
}

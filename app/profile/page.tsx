import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import { LevelBadge } from "@/components/icons";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { levelInfo, MAX_XP } from "@/lib/progress/level";
import { effectiveStreak, kstDate } from "@/lib/progress/streak";

// 프로필 화면 (DESIGN.md 2번 `/profile`, nice): 칭호·레벨 구간, 경험치, 연속 달성(streak)
async function Profile() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const info = levelInfo(user.totalXp);
  const streak = effectiveStreak(user, kstDate());
  const percent = info.maxed ? 100 : Math.round((info.xpIntoSection / info.xpPerSection) * 100);

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <Avatar userId={user.id} nickname={user.nickname} size={88} />
        <p className="mt-2 text-sm text-foreground/60">{user.nickname}</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold">
          <LevelBadge level={info.level} size={28} />
          {info.title}
        </h1>
        <p className="mt-1 text-foreground/70" data-testid="level-section">
          {info.maxed ? "최고 레벨 달성" : `${info.level}레벨 · ${info.section}/${info.sectionCount} 구간`}
        </p>
      </div>

      <section aria-label="경험치" className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/15">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-foreground/60">누적 경험치</span>
          <span className="text-xl font-bold" data-testid="total-xp">
            {user.totalXp.toLocaleString("ko-KR")}점
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/15" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-foreground/60">
          {info.maxed
            ? `모든 구간을 채웠어요 (${MAX_XP.toLocaleString("ko-KR")}점). 경험치는 계속 쌓여요.`
            : `다음 구간까지 ${info.xpToNext}점 (${info.xpIntoSection}/${info.xpPerSection})`}
        </p>
      </section>

      <section aria-label="연속 달성" className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/15">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-foreground/60">연속 달성 (streak)</span>
          <span className="text-xl font-bold" data-testid="streak">
            {streak > 0 ? `${streak}일` : "없음"}
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/60">
          하루(한국 시간)에 완주를 1번 이상 하면 이어져요. 하루라도 거르면 0부터 다시 세요.
        </p>
      </section>

      <p className="text-center text-xs text-foreground/50">
        경험치·레벨·streak 값은 테스트용 더미 데이터예요. 레벨에 따른 혜택은 없어요.
      </p>

      <div className="mt-auto flex flex-col gap-3">
        <LogoutButton />
        <Link href="/" className="text-center text-sm text-foreground/60 underline">
          코스 목록으로
        </Link>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <>
      <header className="border-b border-black/10 px-4 py-4 dark:border-white/15">
        <h1 className="text-xl font-bold">내 프로필</h1>
      </header>
      <Suspense fallback={<p className="py-10 text-center text-foreground/60">불러오는 중이에요…</p>}>
        <Profile />
      </Suspense>
    </>
  );
}

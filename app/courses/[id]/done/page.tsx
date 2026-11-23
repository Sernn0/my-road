import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCompletion } from "@/lib/completions/queries";
import { levelInfo } from "@/lib/progress/level";
import { effectiveStreak, kstDate } from "@/lib/progress/streak";
import { formatDistanceKm } from "@/lib/format";

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

// 한국 시간 기준 날짜
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
}

// 완주 화면 (DESIGN.md 2번 `/courses/[id]/done?completion=번호`): 코스, 날짜, 소요 시간, 거리
async function DoneScreen({ searchParams }: { searchParams: PageProps<"/courses/[id]/done">["searchParams"] }) {
  const { completion } = await searchParams;
  const summary = typeof completion === "string" ? await getCompletion(completion) : null;
  if (!summary) notFound();

  const rows = [
    ["코스", summary.courseName],
    ["날짜", formatDate(summary.completedAt)],
    ["소요 시간", formatDuration(summary.durationSec)],
    ["거리", formatDistanceKm(summary.distanceKm)],
  ];

  // 경험치·레벨·연속 달성 (nice, 더미 데이터). 이번 완주 직전과 직후의 레벨을 비교해 오르면 알린다.
  const user = await getCurrentUser();
  const after = user ? levelInfo(user.totalXp) : null;
  const before = user ? levelInfo(Math.max(0, user.totalXp - summary.xp)) : null;
  const leveledUp = !!(before && after && before.level < after.level);
  const sectionUp = !!(before && after && !leveledUp && (before.section < after.section || (!before.maxed && after.maxed)));
  const streak = user ? effectiveStreak(user, kstDate()) : 0;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <p className="text-4xl">🎉</p>
      <h1 className="text-2xl font-bold">완주했어요!</h1>
      <dl className="w-full divide-y divide-black/10 rounded-2xl border border-black/10 dark:divide-white/15 dark:border-white/15">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-foreground/60">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {user && after && (
        <section aria-label="이번 완주의 보상" className="w-full rounded-2xl border border-black/10 px-4 py-4 text-left dark:border-white/15">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-foreground/60">경험치</span>
            <span className="text-xl font-bold text-emerald-600" data-testid="gained-xp">
              +{summary.xp}점
            </span>
          </div>
          {summary.xp === 0 && (
            <p className="mt-1 text-sm text-foreground/60">오늘 이미 완주한 코스라 경험치는 없어요. (같은 코스는 하루 1회만 인정)</p>
          )}
          <p className="mt-2 text-sm text-foreground/70" data-testid="level-line">
            {after.title} {after.maxed ? "· 최고 레벨" : `${after.section}/${after.sectionCount}`} · 연속 {streak}일
          </p>
          {leveledUp && <p className="mt-2 font-semibold text-emerald-600">레벨 업! {after.title}이(가) 되었어요 🎉</p>}
          {sectionUp && <p className="mt-2 font-semibold text-emerald-600">구간이 올랐어요!</p>}
        </section>
      )}

      <Link href="/" className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700">
        코스 목록으로
      </Link>
    </main>
  );
}

export default function DonePage(props: PageProps<"/courses/[id]/done">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-foreground/60">불러오는 중이에요…</p>}>
      <DoneScreen searchParams={props.searchParams} />
    </Suspense>
  );
}

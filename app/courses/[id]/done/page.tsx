import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import Confetti from "@/components/Confetti";
import CourseThumbnail from "@/components/CourseThumbnail";
import ShareImageButton from "@/components/ShareImageButton";
import UserStats from "@/components/UserStats";
import XpBar from "@/components/XpBar";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCompletion } from "@/lib/completions/queries";
import { formatDateTime, formatDistanceKm, formatDuration, formatPace } from "@/lib/format";
import { courseThumbnail } from "@/lib/geo/thumbnail";
import { thumbBasemap } from "@/lib/map/thumb-basemap";
import { levelInfo } from "@/lib/progress/level";

// 완주 화면 (DESIGN.md 2번 `/courses/[id]/done?completion=번호`)
// 축하 폭죽 + 메달, 코스 모양과 기록(거리·소요 시간·평균 페이스), 프로필과 경험치 막대, 기록 이미지 만들기
async function DoneScreen({ searchParams }: { searchParams: PageProps<"/courses/[id]/done">["searchParams"] }) {
  const { completion } = await searchParams;
  const summary = typeof completion === "string" ? await getCompletion(completion) : null;
  if (!summary) notFound();

  // 코스 모양 (저장된 코스 경로로 그린다. 실제로 달린 궤적은 서버에 없다)
  const thumb = summary.coursePath ? courseThumbnail(summary.coursePath, "photo") : null;
  const basemap = thumb && summary.coursePath ? await thumbBasemap(`${summary.id}:photo`, summary.coursePath, "photo") : null;
  const pace = summary.distanceKm > 0 ? summary.durationSec / summary.distanceKm : 0;

  // 경험치·레벨·연속 달성 (nice, 더미 데이터). 이번 완주 직전과 직후의 레벨을 비교해 오르면 알린다.
  const user = await getCurrentUser();
  const after = user ? levelInfo(user.totalXp) : null;
  const before = user ? levelInfo(Math.max(0, user.totalXp - summary.xp)) : null;
  const leveledUp = !!(before && after && before.level < after.level);
  const sectionUp = !!(before && after && !leveledUp && (before.section < after.section || (!before.maxed && after.maxed)));

  const stats = [
    ["거리", formatDistanceKm(summary.distanceKm)],
    ["소요 시간", formatDuration(summary.durationSec)],
    ["평균 페이스", pace ? formatPace(pace) : "-"],
  ];

  return (
    <main className="relative flex flex-1 flex-col gap-4 overflow-hidden bg-gradient-to-b from-emerald-100/70 via-white to-white px-4 pb-6 pt-8">
      <Confetti />
      <div aria-hidden="true" className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[-60px] top-40 h-40 w-40 rounded-full bg-amber-100/70 blur-3xl" />

      <header className="relative flex flex-col items-center text-center">
        <div className="pop-in">
          <Medal />
        </div>
        <h1 className="rise-in mt-2 text-3xl font-extrabold tracking-tight">완주했어요!</h1>
        <p className="rise-in mt-1 text-sm text-foreground/60" style={{ animationDelay: "0.1s" }}>
          {formatDateTime(summary.completedAt)}
        </p>
      </header>

      {/* 코스와 기록 */}
      <section aria-label="완주 기록" className="rise-in relative rounded-3xl bg-white p-3 shadow-[0_8px_30px_rgb(16_185_129/0.12)] ring-1 ring-black/5" style={{ animationDelay: "0.2s" }}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <CourseThumbnail thumbnail={thumb ? { ...thumb, basemap } : null} label={summary.courseName} />
          <p className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-full bg-white/90 px-3 py-1 text-sm font-bold shadow-sm backdrop-blur">
            {summary.courseName}
          </p>
        </div>
        <dl className="mt-3 grid grid-cols-3 divide-x divide-black/5 text-center">
          {stats.map(([label, value]) => (
            <div key={label} className="px-1">
              <dt className="text-xs text-foreground/50">{label}</dt>
              <dd className="mt-0.5 text-xl font-extrabold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 프로필과 경험치 */}
      {user && after && (
        <section aria-label="이번 완주의 보상" className="rise-in relative rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgb(16_185_129/0.12)] ring-1 ring-black/5" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3">
            <Avatar userId={user.id} nickname={user.nickname} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{user.nickname}</p>
              <div className="mt-0.5 [&>div]:justify-start">
                <UserStats user={user} layout="inline" />
              </div>
            </div>
            <span className="pop-in shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/30" style={{ animationDelay: "0.7s" }} data-testid="gained-xp">
              +{summary.xp} XP
            </span>
          </div>
          <div className="mt-4">
            <XpBar totalXp={user.totalXp} gainedXp={summary.xp} />
          </div>
          {summary.xp === 0 && (
            <p className="mt-2 text-xs text-foreground/50">오늘 이미 완주한 코스라 경험치는 없어요. (같은 코스는 하루 1회만 인정)</p>
          )}
          {(leveledUp || sectionUp) && (
            <p className="pop-in mt-3 rounded-2xl bg-gradient-to-r from-amber-100 to-emerald-100 px-3 py-2 text-center text-sm font-bold text-emerald-800" style={{ animationDelay: "1.6s" }}>
              {leveledUp ? `레벨 업! ${after.title}이(가) 되었어요` : "구간이 올랐어요!"}
            </p>
          )}
        </section>
      )}

      <div className="relative mt-auto flex flex-col gap-3 pt-2">
        <ShareImageButton completionId={summary.id} courseName={summary.courseName} />
        <Link
          href="/"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 active:scale-[0.98] active:bg-emerald-700"
        >
          코스 목록으로
        </Link>
      </div>
    </main>
  );
}

// 완주 메달 (리본 + 금메달 + 별). 살짝 흔들린다.
function Medal() {
  return (
    <svg width="96" height="104" viewBox="0 0 96 104" aria-hidden="true" className="medal-bob drop-shadow-[0_6px_12px_rgb(245_158_11/0.35)]">
      <path d="M26 0h18l10 34H36Z" fill="#10B981" />
      <path d="M52 0h18L60 34H42Z" fill="#059669" />
      <path d="M34 0h6l9 30h-6Z" fill="#fff" opacity="0.35" />
      <circle cx="48" cy="66" r="34" fill="#F59E0B" />
      <circle cx="48" cy="66" r="27" fill="#FCD34D" />
      <circle cx="48" cy="66" r="27" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 4" />
      <path d="m48 50 5 10.2 11.2 1.6-8.1 7.9 1.9 11.2L48 75.6l-10 5.3 1.9-11.2-8.1-7.9 11.2-1.6Z" fill="#fff" />
      <ellipse cx="36" cy="52" rx="7" ry="4" fill="#fff" opacity="0.45" transform="rotate(-35 36 52)" />
    </svg>
  );
}

export default function DonePage(props: PageProps<"/courses/[id]/done">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-foreground/60">불러오는 중이에요…</p>}>
      <DoneScreen searchParams={props.searchParams} />
    </Suspense>
  );
}

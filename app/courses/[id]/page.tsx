import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CourseMapLoader from "@/components/CourseMapLoader";
import { Flame } from "@/components/icons";
import MapAttribution from "@/components/MapAttribution";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCourseRecord } from "@/lib/completions/queries";
import { getCourse } from "@/lib/courses/queries";
import { formatDistanceKm, formatDuration, formatMonthDay } from "@/lib/format";
import { isLoopCourse } from "@/lib/geo/follow";
import { calcXp } from "@/lib/progress/level";
import { kstDate, nextStreak } from "@/lib/progress/streak";

// 운동 시작 전 화면 (DESIGN.md 2번 `/courses/[id]`): 지도가 화면 전체를 채우고, 그 위에 버튼과 코스 카드를 올린다.
// 카드에는 코스 이름·거리와 함께 이 코스의 내 기록(완주 횟수·최고 기록·지난번)과 완주하면 받을 경험치·연속 일수를 보여 준다.
// 날씨는 메인 화면에서 보여 주므로 여기에는 두지 않는다. 공유는 메인 화면 코스 카드의 ⋯ 메뉴에서 한다.
async function CourseDetail({ params }: { params: PageProps<"/courses/[id]">["params"] }) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  const user = await getCurrentUser();
  const record = user ? await getCourseRecord(course.id, user.id) : null;
  // 완주하면 받을 경험치: 완주 저장 API와 같은 계산 (같은 코스는 하루 1번만, 연속 일수 배율 적용)
  const today = kstDate();
  const streakAfter = user ? nextStreak(user, today) : 0;
  const xp = record?.doneToday ? 0 : calcXp(course.distanceKm, streakAfter);
  const streakDoneToday = user?.lastGoalDate === today;
  const loop = isLoopCourse(course.path);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* 지도: 아래 카드와 위 버튼 자리를 비워 두고 코스 전체를 맞춘다 */}
      <div className="absolute inset-0">
        <CourseMapLoader path={course.path} mode="overview" padding={{ top: 100, bottom: 370, left: 40, right: 40 }} attribution={false} />
      </div>

      {/* 위: 뒤로 가기 (지도 위에 떠 있는 둥근 버튼), 지도 출처(ⓘ)는 오른쪽 확대·축소 버튼 아래 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />
      <Link
        href="/"
        aria-label="코스 목록으로 돌아가기"
        className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg ring-1 ring-black/5 active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <MapAttribution className="absolute right-[10px] top-[78px]" />

      {/* 아래: 코스 정보 카드 + 운동 시작 버튼 */}
      <section aria-label="코스 정보" className="sheet-up absolute inset-x-0 bottom-0 px-3 pb-5">
        <div className="rounded-3xl bg-white/95 p-4 shadow-[0_-4px_24px_rgb(0_0_0/0.12)] ring-1 ring-black/5 backdrop-blur">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/10" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex gap-1">
                {course.isDemo && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">시연 코스</span>}
                {loop && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">순환 코스</span>}
              </div>
              <h1 className="line-clamp-2 text-lg font-bold leading-snug">{course.name}</h1>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-foreground/50">코스 거리</p>
              <p className="text-2xl font-extrabold text-emerald-600">{formatDistanceKm(course.distanceKm)}</p>
            </div>
          </div>

          {/* 내 기록과 완주 보상 */}
          {user && record && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-black/5">
                <p className="text-[11px] font-medium text-foreground/50">🏅 내 기록</p>
                {record.count > 0 && record.bestSec !== null && record.lastAt ? (
                  <>
                    <p className="mt-0.5 text-base font-extrabold tabular-nums">최고 {formatDuration(record.bestSec)}</p>
                    <p className="text-[11px] text-foreground/60">
                      완주 {record.count}회 · 지난번 {formatMonthDay(record.lastAt)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-0.5 text-base font-extrabold">첫 완주 도전!</p>
                    <p className="text-[11px] text-foreground/60">아직 이 코스 기록이 없어요</p>
                  </>
                )}
              </div>
              <div className="rounded-2xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200/60">
                <p className="text-[11px] font-medium text-amber-700/80">⚡ 완주하면</p>
                <p className="mt-0.5 text-base font-extrabold text-amber-600">+{xp} XP</p>
                <p className="flex items-center gap-1 text-[11px] text-foreground/60">
                  {record.doneToday ? (
                    "오늘 이미 완주해서 경험치는 없어요"
                  ) : (
                    <>
                      <Flame size={12} />
                      {streakDoneToday ? `오늘 연속 기록 달성 (${streakAfter}일)` : `연속 ${streakAfter}일이 돼요`}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-foreground/60">
            {loop ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow" /> 출발 = 도착 · 한 바퀴 돌아 제자리로 와요
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow" /> 출발
                </span>
                <span className="h-px flex-1 border-t border-dashed border-emerald-300" />
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-white bg-red-600 shadow" /> 도착
                </span>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-foreground/50">출발 지점에 도착하면 운동을 시작하세요.</p>

          <Link
            href={`/courses/${course.id}/run`}
            className="btn-shine mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 active:scale-[0.98] active:bg-emerald-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7Z" fill="currentColor" />
            </svg>
            운동 시작
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function CoursePage(props: PageProps<"/courses/[id]">) {
  return (
    <Suspense fallback={<div className="h-dvh animate-pulse bg-[#F4F8F5]" aria-label="코스를 불러오는 중이에요" />}>
      <CourseDetail params={props.params} />
    </Suspense>
  );
}

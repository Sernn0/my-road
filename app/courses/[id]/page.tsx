import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CourseMapLoader from "@/components/CourseMapLoader";
import ShareButton from "@/components/ShareButton";
import WeatherCard from "@/components/WeatherCard";
import { getCourse } from "@/lib/courses/queries";
import { formatDistanceKm } from "@/lib/format";

// 출발 전 확인 화면 (DESIGN.md 2번 `/courses/[id]`). 경로 지도·거리·날씨. (한 화면 구성 다듬기는 PLAN 9번, 운동 시작 버튼은 10번)
async function CourseDetail({ params }: { params: PageProps<"/courses/[id]">["params"] }) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-background px-4 py-4 dark:border-white/15">
        <Link href="/" aria-label="코스 목록으로 돌아가기" className="text-2xl leading-none">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{course.name}</h1>
          <p className="text-sm text-foreground/60">{formatDistanceKm(course.distanceKm)}</p>
        </div>
        <ShareButton courseId={course.id} courseName={course.name} />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="isolate h-[55dvh] min-h-72 w-full">
          <CourseMapLoader path={course.path} />
        </div>

        {/* 출발 전 확인: 거리와 날씨를 지도 아래에 모아 한 화면에서 본다. 날씨는 따로 불러오므로 늦어도 지도와 거리는 먼저 보인다 */}
        <section className="flex flex-col gap-3 px-4 py-4" aria-label="출발 전 확인">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-foreground/60">코스 거리</span>
            <span className="text-2xl font-bold">{formatDistanceKm(course.distanceKm)}</span>
          </div>
          <Suspense fallback={<p className="text-sm text-foreground/60">날씨를 불러오는 중이에요…</p>}>
            <WeatherCard lat={course.startLat} lng={course.startLng} />
          </Suspense>
        </section>
      </main>

      {/* 시작점에 도착한 뒤 누르는 버튼. 누르면 시간 기록이 시작된다 */}
      <div className="sticky bottom-0 bg-background px-4 pb-6 pt-3">
        <Link
          href={`/courses/${course.id}/run`}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700"
        >
          운동 시작
        </Link>
      </div>
    </>
  );
}

export default function CoursePage(props: PageProps<"/courses/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-foreground/60">코스를 불러오는 중이에요…</p>}>
      <CourseDetail params={props.params} />
    </Suspense>
  );
}

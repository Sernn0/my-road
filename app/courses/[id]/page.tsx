import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CourseMapLoader from "@/components/CourseMapLoader";
import { getCourse } from "@/lib/courses/queries";
import { formatDistanceKm } from "@/lib/format";

// 출발 전 확인 화면 (DESIGN.md 2번 `/courses/[id]`). 지금은 경로 지도와 거리까지. (날씨는 PLAN 8·9번, 운동 시작은 10번)
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
      </header>

      <main className="flex flex-1 flex-col">
        <div className="h-[55dvh] min-h-72 w-full">
          <CourseMapLoader path={course.path} />
        </div>
      </main>
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

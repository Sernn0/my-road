import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import RunView from "@/components/RunView";
import { getCourse } from "@/lib/courses/queries";

// 운동 화면 (DESIGN.md 2번 `/courses/[id]/run`)
async function RunScreen({ params }: { params: PageProps<"/courses/[id]/run">["params"] }) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-background px-4 py-4 dark:border-white/15">
        <Link href={`/courses/${course.id}`} aria-label="출발 전 확인으로 돌아가기" className="text-2xl leading-none">
          ←
        </Link>
        <h1 className="text-lg font-bold">운동</h1>
      </header>
      <main className="flex flex-1 flex-col">
        <RunView
          course={{
            id: course.id,
            name: course.name,
            distanceKm: course.distanceKm,
            startLat: course.startLat,
            startLng: course.startLng,
            path: course.path,
          }}
        />
      </main>
    </>
  );
}

export default function RunPage(props: PageProps<"/courses/[id]/run">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-foreground/60">불러오는 중이에요…</p>}>
      <RunScreen params={props.params} />
    </Suspense>
  );
}

import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import RunView from "@/components/RunView";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getCourseRecord } from "@/lib/completions/queries";
import { getCourse } from "@/lib/courses/queries";

// 운동 화면 (DESIGN.md 2번 `/courses/[id]/run`)
async function RunScreen({
  params,
  searchParams,
}: {
  params: PageProps<"/courses/[id]/run">["params"];
  searchParams: PageProps<"/courses/[id]/run">["searchParams"];
}) {
  const { id } = await params;
  const { scenario } = await searchParams; // 시연 모드 시험용: ?scenario=shortcut
  // 운동 기록은 로그인한 사람만 저장할 수 있으므로, 로그인하지 않았으면 먼저 로그인 화면으로 보낸다
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const course = await getCourse(id, userId);
  if (!course) notFound();
  // 지금 고를 수 없는 코스(순환 코스 임시 비활성화)는 운동을 시작하지 않고 운동 준비 화면으로 돌려보낸다
  if (course.disabled) redirect(`/courses/${course.id}`);
  // 이 코스의 내 최고 기록 (운동 중 "최고 기록보다 몇 초 빠른지" 비교에 쓴다)
  const record = await getCourseRecord(course.id, userId);

  // 뒤로 가기 머리줄 없이 화면 전체를 지도로 쓴다. 나가기(포기)는 운동 화면 안의 버튼으로 한다.
  return (
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
          bestSec={record?.bestSec ?? null}
          scenario={typeof scenario === "string" ? scenario : undefined}
        />
    </main>
  );
}

export default function RunPage(props: PageProps<"/courses/[id]/run">) {
  return (
    <Suspense fallback={<div className="h-dvh animate-pulse bg-[#F4F8F5]" aria-label="불러오는 중이에요" />}>
      <RunScreen params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

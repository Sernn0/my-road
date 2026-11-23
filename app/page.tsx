import { Suspense } from "react";
import AddCourseMenu from "@/components/AddCourseMenu";
import CourseList, { CourseListSkeleton } from "@/components/CourseList";
import ProfileChip, { ProfileChipSkeleton } from "@/components/ProfileChip";

// 메인 화면 (DESIGN.md 2번 `/`): 위쪽 가운데에 내 프로필, 아래에 "나의 코스" 카드 목록(한 줄에 2개).
// 코스 추가(코스 기록하기, 공유 코드로 추가)는 "나의 코스" 오른쪽 + 버튼에서 한다.
// 요청할 때마다 서버에서 불러오는 부분은 Suspense로 감싼다. (Next 16 Cache Components)
export default function Home() {
  return (
    <>
      <header className="border-b border-black/5 px-4 pb-4 pt-6 dark:border-white/10">
        <Suspense fallback={<ProfileChipSkeleton />}>
          <ProfileChip />
        </Suspense>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">나의 코스</h1>
          <AddCourseMenu />
        </div>
        <Suspense fallback={<CourseListSkeleton />}>
          <CourseList />
        </Suspense>
      </main>
    </>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import CourseList from "@/components/CourseList";
import ProfileChip from "@/components/ProfileChip";

// 코스 목록 화면 (DESIGN.md 2번 `/`). 목록은 서버에서 불러와 채운다. (Next 16: 요청 시 데이터는 Suspense 안에서)
export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-background px-4 py-4 dark:border-white/15">
        <div>
          <h1 className="text-xl font-bold">마이로드</h1>
          <p className="mt-0.5 text-sm text-foreground/60">내 운동 코스</p>
        </div>
        <Suspense fallback={null}>
          <ProfileChip />
        </Suspense>
      </header>

      <main className="flex flex-1 flex-col px-4 py-4">
        <Suspense fallback={<p className="py-10 text-center text-foreground/60">코스를 불러오는 중이에요…</p>}>
          <CourseList />
        </Suspense>
      </main>

      {/* 엄지로 누르기 쉽게 화면 아래에 고정한 큰 버튼 */}
      <div className="sticky bottom-0 bg-background px-4 pb-6 pt-3">
        <Link
          href="/courses/record"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700"
        >
          코스 기록하기
        </Link>
      </div>
    </>
  );
}

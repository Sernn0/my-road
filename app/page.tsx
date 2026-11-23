import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

// 코스 목록 화면 (DESIGN.md 2번 `/`).
// 아직 저장소를 연결하기 전이라 목록은 비어 있다. (저장한 코스 불러오기는 PLAN 6번에서 연결)
const courses: Course[] = [];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-background px-4 py-4 dark:border-white/15">
        <h1 className="text-xl font-bold">마이로드</h1>
        <p className="mt-0.5 text-sm text-foreground/60">내 운동 코스</p>
      </header>

      <main className="flex flex-1 flex-col px-4 py-4">
        {courses.length === 0 ? (
          // 코스가 없을 때의 안내 (PRD 5번 규칙)
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-lg font-semibold">아직 저장한 코스가 없어요</p>
            <p className="text-sm text-foreground/60">
              아래 &quot;코스 기록하기&quot;를 눌러
              <br />
              자주 가는 코스를 기록해 보세요.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {courses.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        )}
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

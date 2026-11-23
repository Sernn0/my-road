import Link from "next/link";
import CourseRecorder from "@/components/CourseRecorder";

// 코스 기록 화면 (DESIGN.md 2번 `/courses/record`).
// 위치 권한을 확인하고 경로 수집을 시작한다. ("기록 마무리"는 PLAN 5번에서 추가)
export default function RecordPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-background px-4 py-4 dark:border-white/15">
        <Link href="/" aria-label="코스 목록으로 돌아가기" className="text-2xl leading-none">
          ←
        </Link>
        <h1 className="text-xl font-bold">코스 기록하기</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <CourseRecorder />
      </main>
    </>
  );
}

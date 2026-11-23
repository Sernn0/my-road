import { redirect } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listCourses } from "@/lib/courses/queries";

// 나의 코스 목록: 카드를 한 줄에 2개씩 보여 준다. 요청할 때마다 서버에서 불러온다.
// 비어 있으면 안내 문구를 보여 준다. (PRD 5번) 로그인하지 않았으면 로그인 화면으로 보낸다.
export default async function CourseList() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const courses = await listCourses(userId);

  if (courses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-lg font-semibold">아직 저장한 코스가 없어요</p>
        <p className="text-sm text-foreground/60">
          오른쪽 위 + 버튼에서 &quot;코스 기록하기&quot;를 눌러
          <br />
          자주 가는 코스를 기록해 보세요.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3">
      {courses.map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}

export function CourseListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-label="코스를 불러오는 중이에요">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          <div className="aspect-[4/3] animate-pulse bg-foreground/10" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

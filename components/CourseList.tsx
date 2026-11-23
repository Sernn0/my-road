import CourseCard from "@/components/CourseCard";
import { listCourses } from "@/lib/courses/queries";

// 저장한 코스 목록. 요청할 때마다 서버에서 불러온다. 비어 있으면 안내 문구를 보여 준다. (PRD 5번)
export default async function CourseList() {
  const courses = await listCourses();

  if (courses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">아직 저장한 코스가 없어요</p>
        <p className="text-sm text-foreground/60">
          아래 &quot;코스 기록하기&quot;를 눌러
          <br />
          자주 가는 코스를 기록해 보세요.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {courses.map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}

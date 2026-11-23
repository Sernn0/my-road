import Link from "next/link";
import type { Course } from "@/lib/types";
import { formatDistanceKm } from "@/lib/format";

// 코스 목록의 카드 한 장: 이름과 거리(km). 누르면 출발 전 확인 화면으로 간다.
export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex items-center justify-between rounded-2xl border border-black/10 bg-background px-4 py-4 active:bg-black/5 dark:border-white/15 dark:active:bg-white/10"
    >
      <span className="text-base font-medium">{course.name}</span>
      <span className="text-sm text-foreground/60">
        {formatDistanceKm(course.distanceKm)}
      </span>
    </Link>
  );
}

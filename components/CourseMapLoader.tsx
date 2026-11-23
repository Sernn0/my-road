"use client";

import dynamic from "next/dynamic";

// Leaflet은 서버에서 그릴 수 없어서(브라우저 전용) 화면에서만 불러온다. (DESIGN.md 7번)
const CourseMap = dynamic(() => import("@/components/CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-foreground/60">
      지도를 불러오는 중이에요…
    </div>
  ),
});

export default function CourseMapLoader({
  path,
  current,
}: {
  path: [number, number][];
  current?: [number, number] | null;
}) {
  return <CourseMap path={path} current={current} />;
}

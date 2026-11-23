"use client";

import { distance, point } from "@turf/turf";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentLocation } from "@/lib/location/useCurrentLocation";
import { formatDistanceKm } from "@/lib/format";

// 시작점에서 이 거리(m)보다 멀면 "코스를 이탈했습니다"를 알린다. (PRD 5번, 이탈 기준과 같은 50m)
const START_TOLERANCE_M = 50;

type RunCourse = {
  id: string;
  name: string;
  distanceKm: number;
  startLat: number;
  startLng: number;
};

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}:${p(m)}:${p(total % 60)}` : `${p(m)}:${p(total % 60)}`;
}

// 운동 화면 (PLAN 10번): "운동 시작"을 누르면 이 화면이 열리면서 시간 기록이 시작된다.
// 첫 위치가 코스 시작점에서 50m 밖이면 "코스를 이탈했습니다"를 한 번 알린다.
// (현재 위치·남은 거리는 11번, 이탈 감시는 12번에서 추가)
export default function RunView({ course }: { course: RunCourse }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  // 시간 기록: 화면이 열린 순간부터 1초마다 갱신
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, []);

  // 시연 모드에서는 이 코스의 시작점을 첫 위치로 쓴다
  const [demoStart] = useState({ lat: course.startLat, lng: course.startLng, accuracy: 10 });
  const { status, position, isDemo, retry } = useCurrentLocation(demoStart);

  const offStart =
    position !== null &&
    distance(point([position.lng, position.lat]), point([course.startLng, course.startLat]), {
      units: "meters",
    }) > START_TOLERANCE_M;

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-sm text-foreground/60">
        {course.name} · {formatDistanceKm(course.distanceKm)}
      </p>
      <p className="font-mono text-6xl font-bold" data-testid="elapsed" aria-label="경과 시간">
        {formatElapsed(elapsedMs)}
      </p>
      <p className="text-sm text-foreground/60">운동 중</p>

      {status === "asking" && <p className="text-sm text-foreground/60">현재 위치를 확인하는 중이에요…</p>}

      {status === "denied" && (
        <div role="alert" className="flex flex-col items-center gap-2">
          <p className="font-semibold">위치 권한을 허용해 주세요</p>
          <button type="button" onClick={retry} className="h-11 rounded-2xl bg-emerald-600 px-5 font-semibold text-white">
            다시 시도
          </button>
        </div>
      )}

      {(status === "unavailable" || status === "timeout" || status === "unsupported") && (
        <p role="alert" className="text-sm text-amber-600">
          현재 위치를 알 수 없어요.
        </p>
      )}

      {status === "granted" && offStart && (
        <div role="alert" className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-red-600">코스를 이탈했습니다</p>
          <p className="text-sm text-foreground/60">코스 시작점에서 {START_TOLERANCE_M}m 넘게 떨어져 있어요.</p>
        </div>
      )}
      {status === "granted" && !offStart && <p className="text-sm text-emerald-600">시작점에서 출발했어요</p>}
      {isDemo && <p className="text-sm font-medium text-emerald-600">시연용 가짜 위치예요</p>}

      <Link href={`/courses/${course.id}`} className="mt-4 text-sm text-foreground/60 underline">
        출발 전 확인으로 돌아가기
      </Link>
    </div>
  );
}

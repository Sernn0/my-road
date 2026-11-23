"use client";

import { distance, point } from "@turf/turf";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import CourseMapLoader from "@/components/CourseMapLoader";
import { followProgress } from "@/lib/geo/follow";
import { formatDistanceKm } from "@/lib/format";
import { GPS_ACCURACY_LIMIT_M } from "@/lib/location/config";
import { useCurrentLocation } from "@/lib/location/useCurrentLocation";
import { useWatchPosition } from "@/lib/location/useWatchPosition";

// 시작점에서 이 거리(m)보다 멀면 "코스를 이탈했습니다"를 알린다. (PRD 5번, 이탈 기준과 같은 50m)
const START_TOLERANCE_M = 50;
// 코스에서 이 거리(m)보다 멀리 벗어나면 이탈을 알린다. (PRD 5번)
const OFF_ROUTE_M = 50;
// 이 시간(ms) 동안 위치가 들어오지 않으면 "기록이 끊겼습니다"를 알린다. (PRD 5번)
const LOST_AFTER_MS = 15000;

type RunCourse = {
  id: string;
  name: string;
  distanceKm: number;
  startLat: number;
  startLng: number;
  path: [number, number][];
};

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}:${p(m)}:${p(total % 60)}` : `${p(m)}:${p(total % 60)}`;
}

// 운동 화면 (PLAN 10·11번): 시간 기록, 시작점 확인, 현재 위치와 남은 거리, 코스 이탈 알림,
// 화면 켜짐 안내와 기록 끊김 알림(13번), 위치 정확도 알림(14번).
// (완주 판정은 15번에서 추가)
export default function RunView({ course, scenario }: { course: RunCourse; scenario?: string }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  // 시간 기록: 화면이 열린 순간부터 1초마다 갱신
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, []);

  // 첫 위치 확인 (시연 모드에서는 이 코스의 시작점을 첫 위치로 쓴다)
  const [demoStart] = useState({ lat: course.startLat, lng: course.startLng, accuracy: 10 });
  const { status, position: first, isDemo, retry } = useCurrentLocation(demoStart);
  const offStart =
    first !== null &&
    distance(point([first.lng, first.lat]), point([course.startLng, course.startLat]), {
      units: "meters",
    }) > START_TOLERANCE_M;

  // 위치 권한이 허용된 뒤부터 위치를 계속 받는다
  const watched = useWatchPosition(status === "granted", course.path, scenario);
  // 정확도가 50m보다 나쁜 위치는 계산에 쓰지 않는다 (PRD 5번)
  const usable = watched && watched.accuracy <= GPS_ACCURACY_LIMIT_M ? watched : null;
  const [last, setLast] = useState<typeof usable>(null);
  if (usable && usable !== last) setLast(usable);

  const progress = useMemo(
    () => (last ? followProgress(course.path, last.lat, last.lng) : null),
    [course.path, last],
  );

  // 위치 정확도가 나쁜 상태 (PLAN 14번): 그 점은 계산에서 빼고, 정확도가 좋아질 때까지 기록 확정을 보류한다
  const lowAccuracy = watched !== null && watched.accuracy > GPS_ACCURACY_LIMIT_M;

  // 기록 끊김 (PLAN 13번): 위치가 한동안 들어오지 않으면 알린다
  const lastReceivedAt = useRef(0);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    lastReceivedAt.current = Date.now();
  }, [watched]);
  useEffect(() => {
    if (status !== "granted") return;
    lastReceivedAt.current = Date.now();
    const timer = setInterval(() => setLost(Date.now() - lastReceivedAt.current > LOST_AFTER_MS), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // 화면 켜짐 유지 요청 (지원하는 브라우저만). 화면이 꺼지면 위치 기록이 끊길 수 있다
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    };
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  // 코스에서 50m 넘게 벗어났는지 (PLAN 12번)
  const offRoute = progress !== null && progress.offRouteM > OFF_ROUTE_M;
  useEffect(() => {
    if (offRoute) navigator.vibrate?.(200); // 벗어나는 순간 한 번 진동 (지원하는 기기만)
  }, [offRoute]);

  return (
    <div className="flex w-full flex-1 flex-col">
      <p className="bg-foreground/5 px-4 py-2 text-center text-sm">화면을 켜 두세요. 꺼지면 기록이 끊길 수 있어요.</p>
      {lost && (
        <div role="alert" className="bg-amber-500 px-4 py-3 text-center font-semibold text-black">
          기록이 끊겼습니다
        </div>
      )}
      {lowAccuracy && (
        <div role="alert" className="bg-amber-500 px-4 py-3 text-center font-semibold text-black">
          위치 정확도가 낮습니다
          <span className="block text-sm font-normal">정확도가 좋아질 때까지 기록을 확정하지 않아요</span>
        </div>
      )}
      {offRoute && progress && (
        <div role="alert" className="bg-red-600 px-4 py-3 text-center font-semibold text-white">
          코스에서 벗어났어요 (코스까지 약 {Math.round(progress.offRouteM)}m)
        </div>
      )}
      <div className="h-[42dvh] min-h-60 w-full">
        <CourseMapLoader path={course.path} current={last ? [last.lat, last.lng] : null} />
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 px-4 py-4 text-center">
        <p className="text-sm text-foreground/60">
          {course.name} · {formatDistanceKm(course.distanceKm)}
        </p>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl border border-black/10 px-3 py-3 dark:border-white/15">
            <p className="text-sm text-foreground/60">경과 시간</p>
            <p className="font-mono text-3xl font-bold" data-testid="elapsed">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 px-3 py-3 dark:border-white/15">
            <p className="text-sm text-foreground/60">남은 거리</p>
            <p className="text-3xl font-bold" data-testid="remaining">
              {progress ? formatDistanceKm(progress.remainingKm) : "-"}
            </p>
          </div>
        </div>

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
          <div role="alert" className="flex flex-col items-center gap-1">
            <p className="text-lg font-semibold text-red-600">코스를 이탈했습니다</p>
            <p className="text-sm text-foreground/60">코스 시작점에서 {START_TOLERANCE_M}m 넘게 떨어져 있어요.</p>
          </div>
        )}
        {status === "granted" && !offStart && <p className="text-sm text-emerald-600">시작점에서 출발했어요</p>}
        {isDemo && <p className="text-sm font-medium text-emerald-600">시연용 가짜 위치로 달리는 중이에요</p>}

        <Link href={`/courses/${course.id}`} className="mt-auto pt-2 text-sm text-foreground/60 underline">
          출발 전 확인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

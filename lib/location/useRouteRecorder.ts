"use client";

import { distance, point } from "@turf/turf";
import { useEffect, useState } from "react";
import { DEMO_COURSES } from "@/lib/demo/courses";
import { playPositions, simulatePositions } from "@/lib/demo/simulator";
import { GPS_ACCURACY_LIMIT_M, IS_DEMO, MIN_POINT_GAP_M } from "./config";

// 코스 기록 중 경로 점 모으기 (PLAN 4번). 점은 [위도, 경도] 순서이다.
// 모은 경로는 화면 안에만 있고, "기록 마무리"로 코스로 저장할 때(PLAN 5번)만 서버로 간다.
export type RoutePoint = [number, number];

function gapMeters(a: RoutePoint, b: RoutePoint): number {
  return distance(point([a[1], a[0]]), point([b[1], b[0]]), { units: "meters" });
}

export function useRouteRecorder(enabled: boolean) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [lowAccuracy, setLowAccuracy] = useState(false); // 정확도가 나빠 점을 버리는 중
  const [lost, setLost] = useState(false); // 위치를 더는 받지 못함

  useEffect(() => {
    if (!enabled) return;

    const onPosition = (lat: number, lng: number, accuracy: number) => {
      setLost(false);
      // 정확도가 50m보다 나쁜 점은 경로에 넣지 않는다
      if (accuracy > GPS_ACCURACY_LIMIT_M) {
        setLowAccuracy(true);
        return;
      }
      setLowAccuracy(false);
      setPoints((prev) => {
        const next: RoutePoint = [lat, lng];
        const last = prev[prev.length - 1];
        if (last && gapMeters(last, next) < MIN_POINT_GAP_M) return prev;
        return [...prev, next];
      });
    };

    // 시연 모드: 샘플 코스를 따라 움직이는 가짜 위치를 빠르게 재생한다
    if (IS_DEMO) {
      const fake = simulatePositions(DEMO_COURSES[0].path, { seed: 3, noiseM: 3 });
      return playPositions(fake, (p) => onPosition(p.lat, p.lng, p.accuracy), { speedUp: 15 });
    }

    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => onPosition(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      () => setLost(true),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { points, lowAccuracy, lost };
}

"use client";

import { useEffect, useState } from "react";
import { playPositions, shortcutPath, simulatePositions, type LatLng } from "@/lib/demo/simulator";
import { DEMO_SPEEDUP, IS_DEMO } from "./config";

export type WatchedPosition = { lat: number; lng: number; accuracy: number; timestamp: number };

// 운동 중 위치를 계속 받는다 (PLAN 11번). 받은 위치는 화면에만 쓰고 서버에 보내지 않는다. (PRD 7번)
// 시연 모드에서는 demoPath(코스 경로)를 따라 움직이는 가짜 위치를 빠르게 재생한다.
// scenario(시연 모드에서만 사용, 시험용):
//   "shortcut" = 코스를 벗어나 지름길로 간다, "dropout" = 중간에 위치가 한동안 끊긴다, "lowaccuracy" = 중간에 정확도가 나빠진다
export function useWatchPosition(enabled: boolean, demoPath: LatLng[], scenario?: string) {
  const [position, setPosition] = useState<WatchedPosition | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (IS_DEMO) {
      const route = scenario === "shortcut" ? shortcutPath(demoPath) : demoPath;
      let fake = simulatePositions(route, { seed: 11, noiseM: 4 });
      if (scenario === "dropout") {
        // 600초(10분) 동안의 위치를 빼서 끊김을 만든다. 30배속 재생이라 실제로는 20초 멈춘다
        fake = fake.filter((_, i) => i < 60 || i >= 60 + 300);
      }
      if (scenario === "lowaccuracy") {
        fake = fake.map((p, i) => (i >= 40 && i < 120 ? { ...p, accuracy: 80 } : p));
      }
      return playPositions(fake, (p) => setPosition(p), { speedUp: DEMO_SPEEDUP });
    }

    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) =>
        setPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        }),
      () => {
        // 위치를 못 받으면 새 위치가 오지 않으므로, 운동 화면이 15초 뒤 "기록이 끊겼습니다"로 알린다 (RunView)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, demoPath, scenario]);

  return position;
}

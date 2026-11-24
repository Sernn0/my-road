import { along, bearing, length, lineSliceAlong, lineString, nearestPointOnLine, point } from "@turf/turf";

// 코스를 따라가는 중의 진행 정보 (PLAN 11번). 점은 [위도, 경도] 순서이다.
export type FollowProgress = {
  totalKm: number; // 코스 전체 길이
  alongKm: number; // 코스 위에서 지금까지 온 거리(현재 위치를 코스에 가장 가까운 점으로 옮겨서 잰 값)
  remainingKm: number; // 남은 거리 (코스 경로를 따라 잰 값)
  offRouteM: number; // 코스에서 떨어진 거리(m)
};

// hintKm(직전에 코스 위에서 있던 거리)를 주면, 그 근처(뒤로 150m ~ 앞으로 600m) 구간에서 먼저 찾는다.
// 순환 코스처럼 출발점과 도착점이 겹치거나 길이 서로 가까이 지나가는 곳에서, 진행 거리가 엉뚱한 곳으로 튀지 않게 하려는 것이다.
// 근처 구간에서 이탈 기준(50m)보다 멀면 코스 전체에서 가장 가까운 점을 쓴다. (오래 끊겼다가 멀리서 다시 잡힌 경우)
const NEAR_BACK_KM = 0.15;
const NEAR_AHEAD_KM = 0.6;
const NEAR_MAX_M = 50;

export function followProgress(path: [number, number][], lat: number, lng: number, hintKm?: number): FollowProgress {
  // turf는 [경도, 위도] 순서를 쓴다
  const line = lineString(path.map(([la, ln]) => [ln, la]));
  const totalKm = length(line, { units: "kilometers" });
  const here = point([lng, lat]);
  let alongKm: number | null = null;
  let offKm = 0;
  if (hintKm !== undefined) {
    const from = Math.min(Math.max(hintKm - NEAR_BACK_KM, 0), totalKm);
    const to = Math.min(Math.max(hintKm + NEAR_AHEAD_KM, 0), totalKm);
    if (to - from > 0.001) {
      const near = nearestPointOnLine(lineSliceAlong(line, from, to, { units: "kilometers" }), here, { units: "kilometers" });
      if ((near.properties.dist ?? Infinity) * 1000 <= NEAR_MAX_M) {
        alongKm = from + (near.properties.location ?? 0);
        offKm = near.properties.dist ?? 0;
      }
    }
  }
  if (alongKm === null) {
    const snapped = nearestPointOnLine(line, here, { units: "kilometers" });
    alongKm = snapped.properties.location ?? 0;
    offKm = snapped.properties.dist ?? 0;
  }
  return {
    totalKm,
    alongKm,
    remainingKm: Math.max(0, totalKm - alongKm),
    offRouteM: offKm * 1000,
  };
}

// 출발점과 도착점이 가까우면(60m 이내) 한 바퀴 도는 순환 코스로 본다
export function isLoopCourse(path: [number, number][]): boolean {
  if (path.length < 2) return false;
  const [a, b] = [path[0], path[path.length - 1]];
  const dy = (a[0] - b[0]) * 111_000;
  const dx = (a[1] - b[1]) * 111_000 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dx, dy) <= 60;
}

// 코스 위 alongKm 지점에서 앞으로 가야 할 방향(북쪽 0도, 시계 방향). 운동 중 지도를 "가는 방향이 위"로 돌릴 때 쓴다.
// GPS 흔들림에 덜 흔들리도록, 현재 위치 대신 코스 선의 앞쪽 50m 방향을 쓴다.
export function routeBearingAt(path: [number, number][], alongKm: number): number {
  const line = lineString(path.map(([la, ln]) => [ln, la]));
  const total = length(line, { units: "kilometers" });
  const from = Math.min(Math.max(alongKm, 0), Math.max(total - 0.05, 0));
  const a = along(line, from, { units: "kilometers" });
  const b = along(line, Math.min(from + 0.05, total), { units: "kilometers" });
  const deg = bearing(a, b);
  return (deg + 360) % 360;
}

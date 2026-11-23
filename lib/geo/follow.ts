import { along, bearing, length, lineString, nearestPointOnLine, point } from "@turf/turf";

// 코스를 따라가는 중의 진행 정보 (PLAN 11번). 점은 [위도, 경도] 순서이다.
export type FollowProgress = {
  totalKm: number; // 코스 전체 길이
  alongKm: number; // 코스 위에서 지금까지 온 거리(현재 위치를 코스에 가장 가까운 점으로 옮겨서 잰 값)
  remainingKm: number; // 남은 거리 (코스 경로를 따라 잰 값)
  offRouteM: number; // 코스에서 떨어진 거리(m)
};

export function followProgress(path: [number, number][], lat: number, lng: number): FollowProgress {
  // turf는 [경도, 위도] 순서를 쓴다
  const line = lineString(path.map(([la, ln]) => [ln, la]));
  const totalKm = length(line, { units: "kilometers" });
  const snapped = nearestPointOnLine(line, point([lng, lat]), { units: "kilometers" });
  const alongKm = snapped.properties.location ?? 0;
  const offKm = snapped.properties.dist ?? 0;
  return {
    totalKm,
    alongKm,
    remainingKm: Math.max(0, totalKm - alongKm),
    offRouteM: offKm * 1000,
  };
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

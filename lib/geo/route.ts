import { length, lineString } from "@turf/turf";

// 경로([위도, 경도] 점 목록)의 총 길이(km). 점이 2개 미만이면 0.
export function routeLengthKm(path: [number, number][]): number {
  if (path.length < 2) return 0;
  // turf는 [경도, 위도] 순서를 쓴다
  const line = lineString(path.map(([lat, lng]) => [lng, lat]));
  return length(line, { units: "kilometers" });
}

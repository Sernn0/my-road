import { along, distance, length, lineString, nearestPointOnLine, point } from "@turf/turf";

// 완주 판정 (PLAN 15번, PRD 5번). 점은 [위도, 경도] 순서이다.
// 아래 세 조건을 모두 만족해야 완주로 인정한다. (이동 경로는 기기 안에서만 쓰고 서버에 보내지 않는다)
export const FINISH_RADIUS_M = 30; // 도착 지점 30m 이내
export const MIN_TRAVEL_RATIO = 0.8; // 이동한 거리가 코스 길이의 80% 이상 (한 바퀴 코스에서 출발하자마자 완주되는 것 방지)
export const MIN_SIMILARITY = 0.85; // 모양 유사도 85% 이상 (제안값)
const SAMPLE_GAP_M = 10; // 코스를 10m 간격 점으로 나눈다
const SIMILAR_WITHIN_M = 30; // 이동 경로에서 30m 이내면 "따라갔다"고 본다

export type CompletionJudgement = {
  accepted: boolean;
  endDistanceM: number; // 마지막 위치와 도착 지점 사이 거리
  travelRatio: number; // 이동 거리 ÷ 코스 길이
  similarity: number; // 코스 점 중 이동 경로에서 30m 이내인 점의 비율
  reasons: string[]; // 반려 이유 (완주면 비어 있다)
};

const toLine = (path: [number, number][]) => lineString(path.map(([la, ln]) => [ln, la]));

export function pathLengthKm(path: [number, number][]): number {
  return path.length < 2 ? 0 : length(toLine(path), { units: "kilometers" });
}

export function judgeCompletion(course: [number, number][], trace: [number, number][]): CompletionJudgement {
  const courseKm = pathLengthKm(course);
  const traceKm = pathLengthKm(trace);
  const end = course[course.length - 1];
  const last = trace[trace.length - 1];

  const endDistanceM = last
    ? distance(point([last[1], last[0]]), point([end[1], end[0]]), { units: "meters" })
    : Infinity;
  const travelRatio = courseKm > 0 ? traceKm / courseKm : 0;

  // 모양 유사도: 코스를 10m 간격 점으로 나눠, 이동 경로에서 30m 이내에 있는 점의 비율
  let similarity = 0;
  if (trace.length >= 2 && courseKm > 0) {
    const courseLine = toLine(course);
    const traceLine = toLine(trace);
    const step = SAMPLE_GAP_M / 1000;
    let total = 0;
    let near = 0;
    for (let d = 0; d <= courseKm; d += step) {
      const p = along(courseLine, d, { units: "kilometers" });
      const dist = nearestPointOnLine(traceLine, p, { units: "meters" }).properties.dist ?? Infinity;
      total += 1;
      if (dist <= SIMILAR_WITHIN_M) near += 1;
    }
    similarity = total > 0 ? near / total : 0;
  }

  const reasons: string[] = [];
  if (endDistanceM > FINISH_RADIUS_M) {
    reasons.push(`도착 지점에서 ${Math.round(endDistanceM)}m 떨어져 있어요`);
  }
  if (travelRatio < MIN_TRAVEL_RATIO) {
    reasons.push(`이동한 거리가 코스 길이의 ${Math.round(travelRatio * 100)}%에 그쳤어요 (${Math.round(MIN_TRAVEL_RATIO * 100)}% 이상 필요)`);
  }
  if (similarity < MIN_SIMILARITY) {
    reasons.push(`코스를 따라간 구간이 ${Math.round(similarity * 100)}%뿐이에요 (${Math.round(MIN_SIMILARITY * 100)}% 이상 필요). 코스에서 벗어난 구간이 길었어요`);
  }
  return { accepted: reasons.length === 0, endDistanceM, travelRatio, similarity, reasons };
}

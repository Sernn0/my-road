import { routeLengthKm } from "@/lib/geo/route";

// 코스 저장 기준 (DESIGN.md 4번): 위치 점 2개 이상, 거리 0.1km 이상
export const MIN_COURSE_POINTS = 2;
export const MIN_COURSE_DISTANCE_KM = 0.1;
export const MAX_COURSE_POINTS = 20000;
export const MAX_NAME_LENGTH = 40;
export const TOO_SHORT_MESSAGE = "코스가 너무 짧아 저장할 수 없습니다";

export type CourseInput = { name: string; path: [number, number][] };

export type ValidationResult =
  | { ok: true; name: string; path: [number, number][]; distanceKm: number }
  | { ok: false; code: string; message: string };

function isLatLng(p: unknown): p is [number, number] {
  return (
    Array.isArray(p) &&
    p.length === 2 &&
    typeof p[0] === "number" &&
    typeof p[1] === "number" &&
    Math.abs(p[0]) <= 90 &&
    Math.abs(p[1]) <= 180
  );
}

// 서버가 받은 값을 검사한다. 거리는 화면 값을 믿지 않고 경로로 다시 계산한다.
export function validateCourseInput(body: unknown): ValidationResult {
  const b = (body ?? {}) as Partial<CourseInput>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return { ok: false, code: "INVALID_NAME", message: `코스 이름은 1~${MAX_NAME_LENGTH}자로 적어 주세요` };
  }
  if (!Array.isArray(b.path) || b.path.length > MAX_COURSE_POINTS || !b.path.every(isLatLng)) {
    return { ok: false, code: "INVALID_PATH", message: "경로 형식이 올바르지 않습니다" };
  }
  const distanceKm = Math.round(routeLengthKm(b.path) * 1000) / 1000;
  if (b.path.length < MIN_COURSE_POINTS || distanceKm < MIN_COURSE_DISTANCE_KM) {
    return { ok: false, code: "TOO_SHORT", message: TOO_SHORT_MESSAGE };
  }
  return { ok: true, name, path: b.path, distanceKm };
}

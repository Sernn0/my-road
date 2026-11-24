import { isLoopCourse } from "@/lib/geo/follow";

// 순환 코스 임시 비활성화 (2026-11-24 결정): 순환 코스(출발점 = 도착점)의 완주 판정을 점검하는 동안 고를 수 없게 한다.
// 코스 목록에서는 맨 아래로 보내고 흐리게 보여 주며, 누르면 안내만 띄운다. 운동 화면 주소로 바로 들어와도 시작할 수 없다.
// 점검이 끝나면 아래 값을 false로 바꾸면 원래대로 돌아온다.
export const LOOP_COURSES_DISABLED = true;

export const LOOP_DISABLED_TITLE = "지금은 고를 수 없는 코스예요";
export const LOOP_DISABLED_MESSAGE = "순환 코스(출발 = 도착)는 완주 판정에 문제가 있어 점검 중이에요. 점검이 끝나면 다시 열게요.";

// 이 코스를 지금 고를 수 없는지 (점은 [위도, 경도])
export function isCourseDisabled(path: [number, number][]): boolean {
  return LOOP_COURSES_DISABLED && isLoopCourse(path);
}

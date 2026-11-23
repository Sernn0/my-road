// 위치 관련 공통 설정 (PRD 5번 숫자 기준)

// 시연 모드: NEXT_PUBLIC_DEMO_MODE=true 이면 실제 GPS 대신 가짜 위치를 쓴다. (더미 데이터, 비밀 값 아님)
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// GPS 정확도가 이 값(m)보다 나쁜 위치 점은 쓰지 않는다.
export const GPS_ACCURACY_LIMIT_M = 50;

// 경로에는 직전 점에서 이 거리(m) 이상 움직였을 때만 새 점을 더한다. (제자리 흔들림 방지)
export const MIN_POINT_GAP_M = 5;

import { along, destination, length, lineString, point } from "@turf/turf";

// 가짜 위치 만들기 (시연 모드, 더미 데이터).
// 직접 걷지 못하는 개발 환경에서 코스를 따라 움직이는 위치를 흉내 낸다.
// 좌표는 [위도, 경도] 순서이다.

export type LatLng = [number, number];

export type SimPosition = {
  lat: number;
  lng: number;
  accuracy: number; // 위치 정확도(m). 작을수록 정확하다
  timestamp: number; // 밀리초
};

export type SimOptions = {
  speedMps?: number; // 이동 속도 (m/s). 기본 2.5 (가볍게 달리는 속도)
  intervalSec?: number; // 위치를 받는 간격(초). 기본 2
  noiseM?: number; // GPS 흔들림 크기(m). 기본 5
  accuracyM?: number; // 보고하는 정확도(m). 기본 10
  startTime?: number; // 첫 위치 시각. 기본은 0 (테스트가 같은 결과를 내도록)
  seed?: number; // 흔들림을 정하는 숫자. 같은 값이면 같은 결과
};

// 같은 seed면 같은 값이 나오는 간단한 난수 (테스트를 되풀이할 수 있게)
function makeRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 경로를 따라 일정한 속도로 움직이는 위치 목록을 만든다.
export function simulatePositions(
  path: LatLng[],
  options: SimOptions = {},
): SimPosition[] {
  const {
    speedMps = 2.5,
    intervalSec = 2,
    noiseM = 5,
    accuracyM = 10,
    startTime = 0,
    seed = 1,
  } = options;
  if (path.length < 2) return [];

  const random = makeRandom(seed);
  // turf는 [경도, 위도] 순서를 쓴다
  const line = lineString(path.map(([lat, lng]) => [lng, lat]));
  const totalKm = length(line, { units: "kilometers" });
  const stepKm = (speedMps * intervalSec) / 1000;

  const positions: SimPosition[] = [];
  for (let i = 0; ; i++) {
    const distKm = Math.min(i * stepKm, totalKm);
    const base = along(line, distKm, { units: "kilometers" });
    // 흔들림: 임의의 방향으로 0~noiseM 만큼 벗어난 위치
    const moved =
      noiseM > 0
        ? destination(base, (random() * noiseM) / 1000, random() * 360 - 180, {
            units: "kilometers",
          })
        : point(base.geometry.coordinates);
    const [lng, lat] = moved.geometry.coordinates;
    positions.push({
      lat,
      lng,
      accuracy: accuracyM,
      timestamp: startTime + i * intervalSec * 1000,
    });
    if (distKm >= totalKm) break;
  }
  return positions;
}

// 시험용 경로 1: 지름길. 출발점에서 도착점까지 일직선으로 간다. (완주로 인정되면 안 된다)
export function shortcutPath(path: LatLng[]): LatLng[] {
  return [path[0], path[path.length - 1]];
}

// 시험용 경로 2: 반대 방향. 도착점에서 출발점으로 간다.
export function reversedPath(path: LatLng[]): LatLng[] {
  return [...path].reverse();
}

// 위치 목록을 정해진 간격으로 하나씩 흘려 보낸다. (운동 화면에서 실제 GPS 대신 쓴다)
// speedUp=10이면 10배 빠르게 재생한다. 끝내려면 돌려받은 함수를 호출한다.
export function playPositions(
  positions: SimPosition[],
  onPosition: (position: SimPosition) => void,
  options: { speedUp?: number; onDone?: () => void } = {},
): () => void {
  const { speedUp = 1, onDone } = options;
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = () => {
    if (index >= positions.length) {
      onDone?.();
      return;
    }
    const current = positions[index];
    onPosition(current);
    index += 1;
    if (index < positions.length) {
      const wait = (positions[index].timestamp - current.timestamp) / speedUp;
      timer = setTimeout(tick, wait);
    } else {
      onDone?.();
    }
  };
  tick();

  return () => {
    if (timer) clearTimeout(timer);
  };
}

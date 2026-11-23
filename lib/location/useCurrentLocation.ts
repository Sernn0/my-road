"use client";

import { useCallback, useEffect, useState } from "react";
import { IS_DEMO } from "./config";

// 현재 위치 읽기 (PLAN 3번). 위치는 화면 상태에만 두고 서버나 저장소에 보내지 않는다. (PRD 7번)

export type CurrentLocation = {
  lat: number;
  lng: number;
  accuracy: number; // 위치 정확도(m). 작을수록 정확하다
};

export type LocationStatus =
  | "asking" // 권한 요청·위치 읽는 중
  | "granted" // 위치를 읽었다
  | "denied" // 사용자가 위치 권한을 거부했다
  | "unavailable" // 위치를 알 수 없다 (GPS 신호 없음 등)
  | "timeout" // 시간 안에 위치를 못 읽었다
  | "unsupported"; // 브라우저가 위치 기능을 지원하지 않는다

type State = { status: LocationStatus; position: CurrentLocation | null };

// 시연 모드에서는 권한을 묻지 않고 한밭수목원 근처의 가짜 위치를 쓴다. (더미 데이터)
const DEMO_POSITION: CurrentLocation = { lat: 36.3667, lng: 127.389, accuracy: 10 };

// 위치를 한 번 읽는다. 결과는 항상 비동기로 알려 준다.
function readPosition(
  onOk: (position: CurrentLocation) => void,
  onFail: (status: LocationStatus) => void,
) {
  if (IS_DEMO) {
    Promise.resolve().then(() => onOk(DEMO_POSITION));
    return;
  }
  if (!("geolocation" in navigator)) {
    Promise.resolve().then(() => onFail("unsupported"));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (p) =>
      onOk({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
    (error) =>
      onFail(
        error.code === error.PERMISSION_DENIED
          ? "denied"
          : error.code === error.TIMEOUT
            ? "timeout"
            : "unavailable",
      ),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

export function useCurrentLocation() {
  const [state, setState] = useState<State>({ status: "asking", position: null });

  // 화면이 열리면 위치 권한을 요청하고 현재 위치를 읽는다
  useEffect(() => {
    let active = true;
    readPosition(
      (position) => active && setState({ status: "granted", position }),
      (status) => active && setState({ status, position: null }),
    );
    return () => {
      active = false;
    };
  }, []);

  // 실패했을 때 "다시 시도"에서 쓴다
  const retry = useCallback(() => {
    setState({ status: "asking", position: null });
    readPosition(
      (position) => setState({ status: "granted", position }),
      (status) => setState({ status, position: null }),
    );
  }, []);

  return { ...state, isDemo: IS_DEMO, retry };
}

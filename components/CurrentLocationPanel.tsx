"use client";

import type { ReactNode } from "react";
import {
  useCurrentLocation,
  type CurrentLocation,
  type LocationStatus,
} from "@/lib/location/useCurrentLocation";

// 상태별 안내 문구. 권한 거부 문구는 PRD 5번에서 정한 그대로 쓴다.
const MESSAGES: Record<Exclude<LocationStatus, "asking" | "granted">, { title: string; hint: string }> = {
  denied: {
    title: "위치 권한을 허용해 주세요",
    hint: "브라우저 주소창의 자물쇠 아이콘에서 위치를 허용한 뒤 다시 시도해 주세요.",
  },
  unavailable: {
    title: "현재 위치를 알 수 없어요",
    hint: "GPS 신호가 약할 수 있어요. 하늘이 트인 곳에서 다시 시도해 주세요.",
  },
  timeout: {
    title: "위치를 읽는 데 시간이 오래 걸려요",
    hint: "잠시 뒤 다시 시도해 주세요.",
  },
  unsupported: {
    title: "이 브라우저는 위치 기능을 지원하지 않아요",
    hint: "다른 브라우저로 열어 주세요.",
  },
};

// 위치 권한을 확인하는 화면. 위치를 읽으면 children에 현재 위치를 넘겨 본체를 그린다.
export default function CurrentLocationPanel({
  children,
}: {
  children: (position: CurrentLocation, isDemo: boolean) => ReactNode;
}) {
  const { status, position, isDemo, retry } = useCurrentLocation();

  if (status === "asking") {
    return (
      <p className="text-center text-foreground/60" role="status">
        현재 위치를 확인하는 중이에요…
      </p>
    );
  }

  if (status === "granted" && position) {
    // 위치를 읽었으면 화면 본체를 보여 준다
    return <>{children(position, isDemo)}</>;
  }

  const message = MESSAGES[status as keyof typeof MESSAGES];
  return (
    <div className="flex flex-col items-center gap-3 text-center" role="alert">
      <p className="text-lg font-semibold">{message.title}</p>
      <p className="text-sm text-foreground/60">{message.hint}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-2 h-12 rounded-2xl bg-emerald-600 px-6 font-semibold text-white active:bg-emerald-700"
      >
        다시 시도
      </button>
    </div>
  );
}

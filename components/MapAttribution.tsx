"use client";

import { useState } from "react";

// 지도 출처 표시. 지도 데이터(OpenStreetMap, OpenMapTiles) 사용 조건이라 아예 지울 수는 없어서,
// 처음부터 작은 ⓘ 버튼으로 접어 두고 누르면 출처 문구를 펼친다. (문구와 링크는 OpenFreeMap이 정한 그대로)
// 지도 위에 카드를 올린 화면에서는 지도 기본 표시를 끄고, 이 버튼을 화면 위쪽 버튼(나침반·확대 버튼) 아래에 둔다.
// 펼치면 버튼 왼쪽으로 문구가 늘어난다.
export default function MapAttribution({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const link = "underline-offset-2 hover:underline";
  return (
    <div className={`flex items-center rounded-full bg-white/85 text-[10px] text-foreground/60 shadow-sm ring-1 ring-black/5 backdrop-blur ${className}`}>
      {open && (
        <p className="whitespace-nowrap pl-2.5">
          <a href="https://openfreemap.org" target="_blank" rel="noreferrer" className={link}>
            OpenFreeMap
          </a>{" "}
          <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer" className={link}>
            © OpenMapTiles
          </a>{" "}
          Data from{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className={link}>
            OpenStreetMap
          </a>
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "지도 출처 접기" : "지도 출처 보기"}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 11v6M12 7.5v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

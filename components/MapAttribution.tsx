"use client";

import { useEffect, useState } from "react";

// 지도 출처 표시. 지도 데이터(OpenStreetMap, OpenMapTiles) 사용 조건이라 아예 지울 수는 없다.
// OpenStreetMap 출처 표시 안내에 따라, 처음 5초 동안 보여 준 뒤 작은 ⓘ 버튼으로 접고, 누르면 다시 펼친다.
// 지도 위에 카드를 올린 화면에서는 지도 기본 표시가 카드에 가려지므로, 지도 기본 표시를 끄고 이 표시를 카드 바로 위 오른쪽에 둔다.
// 문구와 링크는 OpenFreeMap이 정한 그대로다.
export default function MapAttribution() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setOpen(false), 5000);
    return () => window.clearTimeout(t);
  }, []);

  const link = "underline-offset-2 hover:underline";
  return (
    <div className="pointer-events-none mb-2 flex justify-end px-1">
      <div className="pointer-events-auto flex items-center rounded-full bg-white/80 text-[10px] text-foreground/60 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {open && (
          <p className="pl-2.5">
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
          className="flex h-6 w-6 items-center justify-center rounded-full"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11v6M12 7.5v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

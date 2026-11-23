"use client";

import { useState } from "react";
import SharePanel from "@/components/SharePanel";

// 출발 전 확인 화면의 공유 버튼 (PLAN 20번, DESIGN.md 2번): 누르면 경고와 함께 공유 패널이 열린다
export default function ShareButton({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-10 rounded-xl border border-black/15 px-3 text-sm font-medium dark:border-white/20"
      >
        공유
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-black/10 bg-background shadow-lg dark:border-white/15">
          <SharePanel courseId={courseId} courseName={courseName} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

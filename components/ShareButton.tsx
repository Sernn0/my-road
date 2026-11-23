"use client";

import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import SharePanel from "@/components/SharePanel";

// 출발 전 확인 화면의 공유 버튼 (PLAN 20번): 누르면 경고와 함께 공유 창이 아래에서 열린다
export default function ShareButton({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-xl border border-black/15 px-3 text-sm font-medium dark:border-white/20"
      >
        공유
      </button>
      {open && (
        <BottomSheet title="코스 공유" onClose={() => setOpen(false)}>
          <SharePanel courseId={courseId} courseName={courseName} onClose={() => setOpen(false)} />
        </BottomSheet>
      )}
    </>
  );
}

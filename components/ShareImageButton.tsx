"use client";

import { useState } from "react";

// 완주 기록 이미지 공유 (PLAN 21번): "이미지 공유"(1탭) → 공유할 앱 선택(2탭).
// 공유 기능이 없는 브라우저에서는 이미지를 내려받는다. 이미지에는 이름·집 주소·이동 경로가 없다.
export default function ShareImageButton({ completionId, courseName }: { completionId: string; courseName: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function share() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/og/${completionId}`);
      if (!res.ok) {
        setMessage("이미지를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], "myroad-record.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${courseName} 완주 기록` });
        return;
      }
      // 공유를 지원하지 않으면 이미지를 내려받는다
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "myroad-record.png";
      a.click();
      URL.revokeObjectURL(url);
      setMessage("이미지를 저장했어요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // 공유 창을 닫음
      setMessage("이미지를 공유하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="h-14 w-full rounded-2xl border border-emerald-600 text-lg font-semibold text-emerald-600 disabled:opacity-50"
      >
        {busy ? "이미지 만드는 중…" : "기록 이미지 공유"}
      </button>
      {message && (
        <p role="status" className="text-sm text-foreground/70">
          {message}
        </p>
      )}
    </div>
  );
}

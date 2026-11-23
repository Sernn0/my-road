"use client";

import { useState } from "react";

// 코스 링크 공유 (PLAN 20번). 코스 링크에는 시작 위치를 포함한 경로가 그대로 보이므로,
// 공유하기 전에 "시작 위치가 보입니다"라는 경고를 먼저 띄운다. (PRD 5번, 7번)
// 링크에는 이름·집 주소 같은 개인정보를 넣지 않는다. (코스 번호만 들어간다)
// 로그인이 더미라서 링크를 받은 사람은 로그인 없이 일단 열린다.
export default function SharePanel({
  courseId,
  courseName,
  onClose,
}: {
  courseId: string;
  courseName: string;
  onClose: () => void;
}) {
  const [result, setResult] = useState<"idle" | "copied" | "shown">("idle");
  const [link, setLink] = useState("");

  async function share() {
    const url = `${window.location.origin}/courses/${courseId}`;
    setLink(url);
    try {
      if (navigator.share) {
        await navigator.share({ title: courseName, text: "마이로드 코스를 공유해요", url });
        setResult("copied");
        return;
      }
      await navigator.clipboard.writeText(url);
      setResult("copied");
    } catch (error) {
      // 사용자가 공유 창을 닫은 경우는 조용히 넘어가고, 복사 권한이 없으면 링크를 직접 보여 준다
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResult("shown");
    }
  }

  return (
    <div className="flex flex-col gap-3 p-2" role="group" aria-label="코스 공유">
      <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-700 dark:text-amber-400" role="alert">
        시작 위치가 보입니다. 링크를 받은 사람은 이 코스의 시작 위치를 포함한 경로를 볼 수 있어요.
      </p>

      {result === "idle" && (
        <div className="flex gap-2">
          <button type="button" onClick={share} className="h-12 flex-1 rounded-xl bg-emerald-600 font-semibold text-white">
            링크 공유
          </button>
          <button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl border border-black/15 dark:border-white/20">
            취소
          </button>
        </div>
      )}

      {result === "copied" && (
        <p className="text-center text-sm font-medium text-emerald-600" role="status">
          링크를 복사하거나 공유했어요
        </p>
      )}

      {result === "shown" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground/70">자동 복사가 안 돼요. 아래 링크를 직접 복사해 주세요.</p>
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="공유 링크" className="h-12 rounded-xl border border-black/15 bg-background px-3 text-sm dark:border-white/20" />
        </div>
      )}

      {result !== "idle" && (
        <button type="button" onClick={onClose} className="h-10 text-sm text-foreground/60 underline">
          닫기
        </button>
      )}
    </div>
  );
}

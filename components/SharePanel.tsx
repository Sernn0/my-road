"use client";

import { useState } from "react";

// 코스 공유 (PLAN 20번). 코스 링크·코드로 시작 위치를 포함한 경로가 그대로 보이므로,
// 공유하기 전에 "시작 위치가 보입니다"라는 경고를 먼저 띄운다. (PRD 5번, 7번)
// 공유 코드(6자리)는 받은 사람이 메인 화면의 "+ → 공유 코드로 코스 추가하기"에 넣어 자기 코스로 담을 수 있다.
export default function SharePanel({
  courseId,
  courseName,
  onClose,
}: {
  courseId: string;
  courseName: string;
  onClose: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function getCode() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/share`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error?.message ?? "공유 코드를 만들지 못했어요");
        return;
      }
      setCode(json.data.code);
    } catch {
      setMessage("네트워크 문제로 공유 코드를 만들지 못했어요");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(done);
    } catch {
      setMessage("자동 복사가 안 돼요. 길게 눌러 직접 복사해 주세요.");
    }
  }

  async function shareLink() {
    const link = `${window.location.origin}/courses/${courseId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: courseName, text: `마이로드 코스 공유 코드: ${code}`, url: link });
        return;
      }
      await copy(link, "링크를 복사했어요");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // 공유 창을 닫음
      setMessage("공유하지 못했어요");
    }
  }

  return (
    <div className="flex flex-col gap-3" role="group" aria-label="코스 공유">
      <p className="rounded-2xl bg-amber-500/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-400" role="alert">
        시작 위치가 보입니다. 공유받은 사람은 이 코스의 시작 위치를 포함한 경로를 볼 수 있어요.
      </p>

      {!code ? (
        <div className="flex gap-2">
          <button type="button" onClick={getCode} disabled={busy} className="h-12 flex-1 rounded-2xl bg-emerald-600 font-semibold text-white disabled:opacity-50">
            {busy ? "만드는 중…" : "공유하기"}
          </button>
          <button type="button" onClick={onClose} className="h-12 flex-1 rounded-2xl border border-black/15 dark:border-white/20">
            취소
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-black/10 px-4 py-4 text-center dark:border-white/15">
            <p className="text-sm text-foreground/60">공유 코드</p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em]" data-testid="share-code">
              {code}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => copy(code, "공유 코드를 복사했어요")} className="h-12 flex-1 rounded-2xl bg-emerald-600 font-semibold text-white">
              코드 복사
            </button>
            <button type="button" onClick={shareLink} className="h-12 flex-1 rounded-2xl border border-emerald-600 font-semibold text-emerald-600">
              링크 공유
            </button>
          </div>
        </>
      )}

      {message && (
        <p className="text-center text-sm text-foreground/70" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

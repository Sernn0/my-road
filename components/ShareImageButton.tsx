"use client";

import { useEffect, useState } from "react";

// 기록 이미지 생성 (PLAN 21번): 버튼을 누르면 포토카드 모양 기록 이미지를 만들어 미리 보여 주고,
// 그 아래에서 "기기에 저장" 또는 "친구에게 공유"를 고른다. 이미지는 /api/og/[completionId]에서 만든다.
type State =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "ready"; file: File; url: string }
  | { status: "error" };

export default function ShareImageButton({ completionId, courseName }: { completionId: string; courseName: string }) {
  const [state, setState] = useState<State>({ status: "closed" });
  const [message, setMessage] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  // 미리보기 그림 주소는 다 쓰면 정리한다
  const readyUrl = state.status === "ready" ? state.url : null;
  useEffect(() => () => {
    if (readyUrl) URL.revokeObjectURL(readyUrl);
  }, [readyUrl]);

  async function create() {
    setMessage(null);
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/og/${completionId}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], "myroad-record.png", { type: "image/png" });
      setCanShare(!!navigator.canShare?.({ files: [file] }));
      setState({ status: "ready", file, url: URL.createObjectURL(blob) });
    } catch {
      setState({ status: "error" });
    }
  }

  function close() {
    setState({ status: "closed" });
    setMessage(null);
  }

  function save() {
    if (state.status !== "ready") return;
    const a = document.createElement("a");
    a.href = state.url;
    a.download = "myroad-record.png";
    a.click();
    setMessage("기기에 저장했어요.");
  }

  async function share() {
    if (state.status !== "ready") return;
    try {
      await navigator.share({ files: [state.file], title: `${courseName} 완주 기록` });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // 공유 창을 닫음
      setMessage("공유하지 못했어요. 저장한 뒤 직접 보내 주세요.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={create}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white text-lg font-semibold text-emerald-700 active:scale-[0.98]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2c.7 4.4 3.1 6.8 7.5 7.5-4.4.7-6.8 3.1-7.5 7.5-.7-4.4-3.1-6.8-7.5-7.5C8.9 8.8 11.3 6.4 12 2Z" fill="currentColor" />
          <path d="M19 15c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" fill="currentColor" opacity="0.6" />
        </svg>
        기록 이미지 생성
      </button>

      {state.status !== "closed" && (
        <div role="dialog" aria-modal="true" aria-label="기록 이미지 미리보기" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/75 px-6 py-6 backdrop-blur-sm">
          <button type="button" onClick={close} aria-label="닫기" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* 포토카드 (1080×1680 비율) */}
          <div className="flex w-full max-w-[300px] flex-1 items-center justify-center">
            {state.status === "loading" && (
              <div className="card-shimmer flex aspect-[1080/1680] w-full flex-col items-center justify-center gap-2 rounded-3xl text-sm font-medium text-emerald-700">
                <span className="text-2xl">✨</span>
                기록 이미지를 만드는 중이에요…
              </div>
            )}
            {state.status === "error" && (
              <div className="flex aspect-[1080/1680] w-full flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 text-center">
                <p className="text-sm text-foreground/70">이미지를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>
                <button type="button" onClick={create} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                  다시 만들기
                </button>
              </div>
            )}
            {state.status === "ready" && (
              <div className="photocard-in photocard-shine w-full rounded-[22px] shadow-2xl shadow-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element -- 방금 만든 이미지(blob 주소)라 next/image를 쓸 수 없다 */}
                <img src={state.url} alt={`${courseName} 완주 기록 이미지`} className="block w-full rounded-[22px]" />
              </div>
            )}
          </div>

          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            {/* 공유 전 경고 (PRD 5번): 이미지의 코스 모양에는 시작 위치가 보인다 */}
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-200">
              <span aria-hidden="true">⚠️</span> 이미지에 코스 시작 위치가 보여요. 공유 전에 확인해 주세요.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={save}
                disabled={state.status !== "ready"}
                className="flex h-13 items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 font-semibold text-slate-800 active:scale-[0.98] disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                기기에 저장
              </button>
              <button
                type="button"
                onClick={share}
                disabled={state.status !== "ready" || !canShare}
                className="flex h-13 items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                친구에게 공유
              </button>
            </div>
            <p role="status" className="min-h-5 text-center text-xs text-white/70">
              {message ??
                (state.status === "ready" && !canShare
                  ? "이 브라우저는 바로 공유를 지원하지 않아요. 저장한 뒤 보내 주세요."
                  : "아이폰은 '친구에게 공유' → '이미지 저장'을 누르면 사진 앱에 저장돼요.")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

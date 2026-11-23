"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/lib/types";
import { formatDistanceKm } from "@/lib/format";

type Mode = "closed" | "menu" | "rename" | "confirmDelete";

// 코스 목록의 카드 한 장: 이름·거리(km), 누르면 출발 전 확인 화면으로 간다.
// 오른쪽 설정 버튼에서 이름 변경, 삭제, 공유를 고를 수 있다. (공유는 nice 기능이라 아직 준비 중)
export default function CourseCard({ course }: { course: Course }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("closed");
  const [name, setName] = useState(course.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(method: "PATCH" | "DELETE") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PATCH" ? JSON.stringify({ name }) : undefined,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setMessage(json?.error?.message ?? "처리하지 못했습니다");
        return;
      }
      setMode("closed");
      router.refresh(); // 목록을 다시 불러온다
    } catch {
      setMessage("네트워크 문제로 처리하지 못했습니다");
    } finally {
      setBusy(false);
    }
  }

  const menuButton =
    "h-12 w-full rounded-xl px-4 text-left active:bg-black/5 dark:active:bg-white/10";

  return (
    <div className="rounded-2xl border border-black/10 bg-background dark:border-white/15">
      <div className="flex items-center">
        <Link
          href={`/courses/${course.id}`}
          className="flex flex-1 items-center justify-between rounded-l-2xl px-4 py-4 active:bg-black/5 dark:active:bg-white/10"
        >
          <span className="text-base font-medium">{course.name}</span>
          <span className="text-sm text-foreground/60">{formatDistanceKm(course.distanceKm)}</span>
        </Link>
        <button
          type="button"
          aria-label={`${course.name} 설정`}
          onClick={() => {
            setMessage(null);
            setMode(mode === "closed" ? "menu" : "closed");
          }}
          className="h-14 w-12 rounded-r-2xl text-xl text-foreground/60 active:bg-black/5 dark:active:bg-white/10"
        >
          ⋯
        </button>
      </div>

      {mode !== "closed" && (
        <div className="flex flex-col gap-1 border-t border-black/10 p-2 dark:border-white/15">
          {mode === "menu" && (
            <>
              <button type="button" className={menuButton} onClick={() => setMode("rename")}>
                이름 변경
              </button>
              <button type="button" className={`${menuButton} text-red-600`} onClick={() => setMode("confirmDelete")}>
                삭제
              </button>
              <button type="button" className={`${menuButton} text-foreground/40`} disabled>
                공유 (준비 중)
              </button>
            </>
          )}

          {mode === "rename" && (
            <div className="flex flex-col gap-2 p-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                aria-label="새 코스 이름"
                className="h-12 rounded-xl border border-black/15 bg-background px-3 dark:border-white/20"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || name.trim() === ""}
                  onClick={() => call("PATCH")}
                  className="h-12 flex-1 rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "저장 중…" : "저장"}
                </button>
                <button type="button" onClick={() => setMode("closed")} className="h-12 flex-1 rounded-xl border border-black/15 dark:border-white/20">
                  취소
                </button>
              </div>
            </div>
          )}

          {mode === "confirmDelete" && (
            <div className="flex flex-col gap-2 p-2">
              <p className="text-sm">이 코스를 삭제할까요? 완주 기록도 함께 지워져요.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => call("DELETE")}
                  className="h-12 flex-1 rounded-xl bg-red-600 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "삭제 중…" : "삭제"}
                </button>
                <button type="button" onClick={() => setMode("closed")} className="h-12 flex-1 rounded-xl border border-black/15 dark:border-white/20">
                  취소
                </button>
              </div>
            </div>
          )}

          {message && (
            <p className="px-2 pb-1 text-sm text-amber-600" role="alert">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

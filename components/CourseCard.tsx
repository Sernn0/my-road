"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import CourseThumbnail from "@/components/CourseThumbnail";
import SharePanel from "@/components/SharePanel";
import { MoreIcon } from "@/components/icons";
import { formatDistanceKm } from "@/lib/format";
import type { Course } from "@/lib/types";

type Mode = "closed" | "menu" | "rename" | "confirmDelete" | "share";

// 코스 카드 (메인 화면, 한 줄에 2개): 코스 모양 썸네일, 이름, 거리(km). 누르면 출발 전 확인 화면으로 간다.
// 오른쪽 위 ⋯ 버튼에서 공유, 이름 변경, 삭제를 고른다. (시연 코스는 공유만)
export default function CourseCard({ course }: { course: Course }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("closed");
  const [name, setName] = useState(course.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const close = () => {
    setMode("closed");
    setMessage(null);
  };

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
      close();
      router.refresh(); // 목록을 다시 불러온다
    } catch {
      setMessage("네트워크 문제로 처리하지 못했습니다");
    } finally {
      setBusy(false);
    }
  }

  const menuButton = "h-14 w-full rounded-2xl px-4 text-left text-base active:bg-foreground/5";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-background shadow-sm dark:border-white/10">
      <Link href={`/courses/${course.id}`} className="block active:opacity-80">
        <div className="aspect-[4/3] w-full bg-emerald-50 text-foreground dark:bg-emerald-950/40">
          <CourseThumbnail thumbnail={course.thumbnail} label={course.name} />
        </div>
        <div className="flex flex-col gap-0.5 px-3 pb-3 pt-2">
          <span className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5">{course.name}</span>
          <span className="text-xs text-foreground/60">{formatDistanceKm(course.distanceKm)}</span>
        </div>
      </Link>

      {course.isDemo && (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
          시연
        </span>
      )}
      <button
        type="button"
        aria-label={`${course.name} 설정`}
        onClick={() => setMode("menu")}
        className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground/70 shadow-sm backdrop-blur active:bg-background"
      >
        <MoreIcon />
      </button>

      {mode !== "closed" && (
        <BottomSheet
          title={mode === "share" ? "코스 공유" : mode === "rename" ? "이름 변경" : mode === "confirmDelete" ? "코스 삭제" : course.name}
          onClose={close}
        >
          {mode === "menu" && (
            <div className="flex flex-col gap-1">
              <button type="button" className={menuButton} onClick={() => setMode("share")}>
                공유
              </button>
              {/* 시연용 샘플 코스는 이름 변경·삭제를 할 수 없다 */}
              {!course.isDemo && (
                <>
                  <button type="button" className={menuButton} onClick={() => setMode("rename")}>
                    이름 변경
                  </button>
                  <button type="button" className={`${menuButton} text-red-600`} onClick={() => setMode("confirmDelete")}>
                    삭제
                  </button>
                </>
              )}
            </div>
          )}

          {mode === "share" && <SharePanel courseId={course.id} courseName={course.name} onClose={close} />}

          {mode === "rename" && (
            <div className="flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                aria-label="새 코스 이름"
                className="h-14 rounded-2xl border border-black/15 bg-background px-4 text-lg dark:border-white/20"
              />
              <button
                type="button"
                disabled={busy || name.trim() === ""}
                onClick={() => call("PATCH")}
                className="h-14 rounded-2xl bg-emerald-600 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "저장 중…" : "저장"}
              </button>
            </div>
          )}

          {mode === "confirmDelete" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm">&quot;{course.name}&quot; 코스를 삭제할까요? 완주 기록도 함께 지워져요.</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => call("DELETE")}
                className="h-14 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "삭제 중…" : "삭제"}
              </button>
            </div>
          )}

          {message && (
            <p className="mt-3 text-center text-sm text-amber-600" role="alert">
              {message}
            </p>
          )}
        </BottomSheet>
      )}
    </div>
  );
}

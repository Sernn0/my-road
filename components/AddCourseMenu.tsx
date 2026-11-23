"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import { PlusIcon } from "@/components/icons";

// "나의 코스" 오른쪽 + 버튼: 코스 기록하기, 공유 코드로 코스 추가하기
export default function AddCourseMenu() {
  const router = useRouter();
  const [open, setOpen] = useState<"closed" | "menu" | "code">("closed");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const close = () => {
    setOpen("closed");
    setCode("");
    setMessage(null);
  };

  async function addByCode() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/courses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(json?.error?.message ?? "코스를 추가하지 못했어요");
        return;
      }
      close();
      router.refresh(); // 목록을 다시 불러온다
    } catch {
      setMessage("네트워크 문제로 추가하지 못했어요");
    } finally {
      setBusy(false);
    }
  }

  const item = "flex h-14 w-full items-center rounded-2xl px-4 text-left text-base active:bg-foreground/5";

  return (
    <>
      <button
        type="button"
        aria-label="코스 추가"
        onClick={() => setOpen("menu")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm active:bg-emerald-700"
      >
        <PlusIcon />
      </button>

      {open === "menu" && (
        <BottomSheet title="코스 추가" onClose={close}>
          <div className="flex flex-col gap-1">
            <Link href="/courses/record" className={item} onClick={close}>
              코스 기록하기
            </Link>
            <button type="button" className={item} onClick={() => setOpen("code")}>
              공유 코드로 코스 추가하기
            </button>
          </div>
        </BottomSheet>
      )}

      {open === "code" && (
        <BottomSheet title="공유 코드로 코스 추가하기" onClose={close}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-foreground/60">친구에게 받은 6자리 공유 코드나 공유 링크를 넣어 주세요.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: ABC234"
              aria-label="공유 코드"
              autoCapitalize="characters"
              autoComplete="off"
              className="h-14 rounded-2xl border border-black/15 bg-background px-4 text-center font-mono text-xl tracking-widest dark:border-white/20"
            />
            <button
              type="button"
              onClick={addByCode}
              disabled={busy || code.trim() === ""}
              className="h-14 rounded-2xl bg-emerald-600 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "추가하는 중…" : "내 코스에 추가"}
            </button>
            {message && (
              <p className="text-center text-sm text-amber-600" role="alert">
                {message}
              </p>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

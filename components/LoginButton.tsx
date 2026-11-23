"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

// 테스트 계정 하나를 누르면 그 계정으로 로그인한다 (더미 로그인, 비밀번호 없음)
export default function LoginButton({ userId, label, children }: { userId: string; label: string; children: ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function login() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={login}
      disabled={busy}
      aria-label={`${label} 계정으로 시작`}
      className="flex w-full flex-col items-center gap-2 rounded-3xl px-1 py-3 transition active:scale-95 active:bg-foreground/5 disabled:opacity-60"
    >
      {children}
      {failed && <span className="text-xs text-amber-600">다시 눌러 주세요</span>}
    </button>
  );
}

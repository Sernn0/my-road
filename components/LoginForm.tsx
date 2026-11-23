"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Account = { id: string; nickname: string; summary: string };

// 더미 로그인·회원가입 (PLAN 17번). 실제 인증이 아니고 비밀번호도 받지 않는다. 이름·이메일 같은 개인정보도 넣지 않는다.
export default function LoginForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(url: string, body: object) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setMessage(json?.error?.message ?? "처리하지 못했습니다");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMessage("네트워크 문제로 처리하지 못했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="더미 계정으로 로그인" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">더미 계정으로 시작</h2>
        <p className="text-sm text-foreground/60">테스트용 가짜 계정이에요. 비밀번호는 필요 없어요.</p>
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={busy}
            onClick={() => send("/api/login", { userId: a.id })}
            className="flex flex-col items-start rounded-2xl border border-black/10 px-4 py-3 text-left active:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:active:bg-white/10"
          >
            <span className="font-semibold">{a.nickname}</span>
            <span className="text-sm text-foreground/60">{a.summary}</span>
          </button>
        ))}
      </section>

      <section aria-label="새 더미 계정 만들기" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">새 계정 만들기</h2>
        <p className="text-sm text-foreground/60">닉네임만 정하면 돼요. 실제 이름이나 이메일은 넣지 마세요.</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={12}
          placeholder="닉네임 (12자까지)"
          aria-label="닉네임"
          className="h-14 rounded-2xl border border-black/15 bg-background px-4 text-lg dark:border-white/20"
        />
        <button
          type="button"
          disabled={busy || nickname.trim() === ""}
          onClick={() => send("/api/signup", { nickname })}
          className="h-14 rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
        >
          가입하고 시작하기
        </button>
      </section>

      {message && (
        <p role="alert" className="text-center text-sm text-amber-600">
          {message}
        </p>
      )}
    </div>
  );
}

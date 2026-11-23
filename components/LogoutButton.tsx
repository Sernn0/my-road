"use client";

import { useRouter } from "next/navigation";

// 더미 로그아웃: 기억해 둔 계정을 지우고 로그인 화면으로 간다.
export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="h-12 w-full rounded-2xl border border-black/15 font-medium dark:border-white/20"
    >
      로그아웃
    </button>
  );
}

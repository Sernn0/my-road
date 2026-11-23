import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import { listUsers } from "@/lib/auth/current-user";
import { describeProgress } from "@/lib/progress/summary";

// 로그인 화면 (DESIGN.md 2번 `/login`, nice, 더미). 계정 목록은 서버에서 불러온다.
async function Accounts() {
  const users = await listUsers();
  const accounts = users.map((u) => ({ id: u.id, nickname: u.nickname, summary: describeProgress(u) }));
  return <LoginForm accounts={accounts} />;
}

export default function LoginPage() {
  return (
    <>
      <header className="border-b border-black/10 px-4 py-4 dark:border-white/15">
        <h1 className="text-xl font-bold">마이로드</h1>
        <p className="mt-0.5 text-sm text-foreground/60">시작하기 (더미 로그인)</p>
      </header>
      <main className="flex-1 px-4 py-6">
        <Suspense fallback={<p className="text-center text-foreground/60">계정을 불러오는 중이에요…</p>}>
          <Accounts />
        </Suspense>
      </main>
    </>
  );
}

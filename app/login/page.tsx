import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import LoginButton from "@/components/LoginButton";
import { LogoMark, LogoWordmark } from "@/components/Logo";
import UserStats from "@/components/UserStats";
import { listUsers } from "@/lib/auth/current-user";

// 로그인(스플래시) 화면: 앱 이름을 가운데보다 조금 위에 두고, 그 아래에 테스트 계정 3개를 보여 준다.
// 계정을 누르면 그 계정으로 시작한다. (MVP는 테스트 계정으로만 시연하므로 새 계정 만들기는 없다)
async function Accounts() {
  const users = await listUsers();
  return (
    <ul className="grid w-full grid-cols-3 gap-2">
      {users.map((u) => (
        <li key={u.id}>
          <LoginButton userId={u.id} label={u.nickname}>
            <Avatar userId={u.id} nickname={u.nickname} size={76} />
            <span className="text-sm font-semibold">{u.nickname}</span>
            <UserStats user={u} layout="stack" />
          </LoginButton>
        </li>
      ))}
    </ul>
  );
}

function AccountsSkeleton() {
  return (
    <div className="grid w-full grid-cols-3 gap-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 py-3">
          <div className="h-[76px] w-[76px] animate-pulse rounded-full bg-foreground/10" />
          <div className="h-4 w-16 animate-pulse rounded bg-foreground/10" />
          <div className="h-8 w-14 animate-pulse rounded bg-foreground/10" />
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center px-5">
      {/* 위 여백을 아래보다 작게 두어 앱 이름이 화면 가운데보다 조금 위에 오게 한다 */}
      <div className="flex-[0.8]" />
      <div className="splash-in flex flex-col items-center gap-2 text-center">
        <div className="pop-in">
          <LogoMark size={76} id="splash" />
        </div>
        <h1 className="mt-3">
          <LogoWordmark height={50} animate />
        </h1>
        <p className="mt-1 text-sm text-foreground/60">나만의 운동 코스를 기록하고 따라가요</p>
      </div>

      <section aria-label="테스트 계정" className="splash-in-late mt-14 flex w-full flex-col items-center gap-3">
        <p className="text-xs text-foreground/50">테스트 계정을 골라 시작하세요</p>
        <Suspense fallback={<AccountsSkeleton />}>
          <Accounts />
        </Suspense>
      </section>
      <div className="flex-1" />
    </main>
  );
}

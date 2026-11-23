import Link from "next/link";
import Avatar from "@/components/Avatar";
import UserStats from "@/components/UserStats";
import { getCurrentUser } from "@/lib/auth/current-user";

// 메인 화면 위쪽 가운데의 간단한 프로필: 캐릭터, 닉네임, 레벨·연속 달성. 누르면 프로필 화면으로 간다.
// 로그인하지 않았으면 아무것도 그리지 않는다. (목록 쪽에서 로그인 화면으로 보낸다)
export default async function ProfileChip() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <Link href="/profile" aria-label="내 프로필 보기" className="flex flex-col items-center gap-1.5 active:opacity-80">
      <Avatar userId={user.id} nickname={user.nickname} size={56} />
      <span className="text-base font-bold">{user.nickname}</span>
      <UserStats user={user} layout="inline" />
    </Link>
  );
}

export function ProfileChipSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden="true">
      <div className="h-14 w-14 animate-pulse rounded-full bg-foreground/10" />
      <div className="h-4 w-20 animate-pulse rounded bg-foreground/10" />
      <div className="h-3 w-28 animate-pulse rounded bg-foreground/10" />
    </div>
  );
}

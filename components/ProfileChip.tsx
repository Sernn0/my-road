import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { describeProgress } from "@/lib/progress/summary";

// 홈 화면 오른쪽 위의 프로필 바로가기: 닉네임과 레벨·연속 일수 한 줄. 로그인하지 않았으면 아무것도 그리지 않는다.
export default async function ProfileChip() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <Link href="/profile" className="flex flex-col items-end text-right" aria-label="내 프로필 보기">
      <span className="text-sm font-semibold">{user.nickname}</span>
      <span className="text-xs text-foreground/60">{describeProgress(user)}</span>
    </Link>
  );
}

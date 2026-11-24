import { levelInfo, MAX_XP } from "@/lib/progress/level";

// 경험치 막대 (프로필 화면과 완주 화면에서 함께 쓴다).
// gainedXp를 주면 이번에 받은 만큼 막대가 이전 값에서 차오르는 애니메이션을 보여 준다. (globals.css의 .xp-fill)
// 이번 완주로 구간이나 레벨이 바뀌었으면 새 구간의 0에서부터 차오른다.
export default function XpBar({ totalXp, gainedXp = 0 }: { totalXp: number; gainedXp?: number }) {
  const info = levelInfo(totalXp);
  const before = levelInfo(Math.max(0, totalXp - gainedXp));
  const percentOf = (i: typeof info) => (i.maxed ? 100 : Math.round((i.xpIntoSection / i.xpPerSection) * 100));
  const to = percentOf(info);
  const sameSection = before.level === info.level && before.section === info.section && before.maxed === info.maxed;
  const from = gainedXp > 0 ? (sameSection ? percentOf(before) : 0) : to;

  return (
    <div>
      <div
        className="h-3 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-label="다음 구간까지 경험치"
        aria-valuenow={to}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="xp-fill h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          style={{ width: `${to}%`, ["--xp-from" as string]: `${from}%`, ["--xp-to" as string]: `${to}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-foreground/60">
        {info.maxed
          ? `모든 구간을 채웠어요 (${MAX_XP.toLocaleString("ko-KR")}점). 경험치는 계속 쌓여요.`
          : `다음 구간까지 ${info.xpToNext}점 (${info.xpIntoSection}/${info.xpPerSection})`}
      </p>
    </div>
  );
}

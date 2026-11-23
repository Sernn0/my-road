import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCompletion } from "@/lib/completions/queries";
import { formatDistanceKm } from "@/lib/format";

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

// 한국 시간 기준 날짜
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
}

// 완주 화면 (DESIGN.md 2번 `/courses/[id]/done?completion=번호`): 코스, 날짜, 소요 시간, 거리
async function DoneScreen({ searchParams }: { searchParams: PageProps<"/courses/[id]/done">["searchParams"] }) {
  const { completion } = await searchParams;
  const summary = typeof completion === "string" ? await getCompletion(completion) : null;
  if (!summary) notFound();

  const rows = [
    ["코스", summary.courseName],
    ["날짜", formatDate(summary.completedAt)],
    ["소요 시간", formatDuration(summary.durationSec)],
    ["거리", formatDistanceKm(summary.distanceKm)],
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <p className="text-4xl">🎉</p>
      <h1 className="text-2xl font-bold">완주했어요!</h1>
      <dl className="w-full divide-y divide-black/10 rounded-2xl border border-black/10 dark:divide-white/15 dark:border-white/15">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-foreground/60">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href="/" className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700">
        코스 목록으로
      </Link>
    </main>
  );
}

export default function DonePage(props: PageProps<"/courses/[id]/done">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-foreground/60">불러오는 중이에요…</p>}>
      <DoneScreen searchParams={props.searchParams} />
    </Suspense>
  );
}

"use client";

import { distance, point } from "@turf/turf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import CourseMapLoader from "@/components/CourseMapLoader";
import MapAttribution from "@/components/MapAttribution";
import { FINISH_RADIUS_M, judgeCompletion } from "@/lib/geo/completion";
import { followProgress, isLoopCourse, routeBearingAt, type FollowProgress } from "@/lib/geo/follow";
import { formatDistanceKm, formatGap, formatPace } from "@/lib/format";
import { DEMO_SPEEDUP, GPS_ACCURACY_LIMIT_M, IS_DEMO } from "@/lib/location/config";
import { useCurrentLocation } from "@/lib/location/useCurrentLocation";
import { useWatchPosition } from "@/lib/location/useWatchPosition";

// 시작점에서 이 거리(m)보다 멀면 "코스를 이탈했습니다"를 알린다. (PRD 5번, 이탈 기준과 같은 50m)
const START_TOLERANCE_M = 50;
// 코스에서 이 거리(m)보다 멀리 벗어나면 이탈을 알린다. (PRD 5번)
const OFF_ROUTE_M = 50;
// 이 시간(ms) 동안 위치가 들어오지 않으면 "기록이 끊겼습니다"를 알린다. (PRD 5번)
const LOST_AFTER_MS = 15000;
// 1km 통과·중간 응원 알림을 보여 주는 시간(ms, 실제 시간)
const CHEER_MS = 4000;
// 위치가 다시 들어와도 "기록이 끊겼습니다"를 이 시간(ms) 동안 더 보여 준다 (화면을 다시 켰을 때 놓치지 않게)
const LOST_NOTICE_MS = 5000;
// 시연 모드는 가짜 위치를 배속 재생하므로 소요 시간도 같은 배속으로 센다
const TIME_SCALE = IS_DEMO ? DEMO_SPEEDUP : 1;

// 운동 중 응원 알림 (1km 통과, 절반, 거의 도착)
type Cheer = { key: string; emoji: string; title: string; sub: string; at: number };

type RunCourse = {
  id: string;
  name: string;
  distanceKm: number;
  startLat: number;
  startLng: number;
  path: [number, number][];
};

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}:${p(m)}:${p(total % 60)}` : `${p(m)}:${p(total % 60)}`;
}

// 운동 결과: 달리는 중 / 완주(저장 중) / 저장 실패 / 반려
type Outcome =
  | { kind: "running" }
  | { kind: "accepted"; durationSec: number; attempt: number }
  | { kind: "saveFailed"; durationSec: number; message: string }
  | { kind: "rejected"; reasons: string[] };

// 운동 화면 (PLAN 10·11번): 시간 기록, 시작점 확인, 현재 위치와 남은 거리, 코스 이탈 알림,
// 화면 켜짐 안내와 기록 끊김 알림(13번), 위치 정확도 알림(14번),
// 도착 시 완주 판정(15번)과 완주 요약 저장(16번). 이동 경로는 이 화면 안에서만 쓰고 서버에는 보내지 않는다.
export default function RunView({
  course,
  bestSec,
  scenario,
}: {
  course: RunCourse;
  bestSec: number | null; // 이 코스의 내 최고 기록(초). 없으면 null
  scenario?: string;
}) {
  const router = useRouter();
  const [realMs, setRealMs] = useState(0); // 화면이 열린 뒤 흐른 실제 시간
  const elapsedMs = realMs * TIME_SCALE; // 소요 시간 (시연 모드는 배속 적용)
  const [giveUpAsk, setGiveUpAsk] = useState(false); // 운동 포기 확인 중

  // 시간 기록: 화면이 열린 순간부터 갱신 (시연 모드는 배속이라 더 자주 갱신한다)
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => setRealMs(Date.now() - startedAt), IS_DEMO ? 100 : 1000);
    return () => clearInterval(timer);
  }, []);

  // 첫 위치 확인 (시연 모드에서는 이 코스의 시작점을 첫 위치로 쓴다)
  const [demoStart] = useState({ lat: course.startLat, lng: course.startLng, accuracy: 10 });
  const { status, position: first, isDemo, retry } = useCurrentLocation(demoStart);
  // 첫 위치가 정확할 때(50m 이내)만 시작점과 비교한다. GPS가 처음에 흐리면 잘못 알릴 수 있어서다
  const offStart =
    first !== null &&
    first.accuracy <= GPS_ACCURACY_LIMIT_M &&
    distance(point([first.lng, first.lat]), point([course.startLng, course.startLat]), {
      units: "meters",
    }) > START_TOLERANCE_M;
  const [reachedStart, setReachedStart] = useState(false); // 시작점 50m 안에 들어온 적이 있는지 (들어오면 시작점 경고를 지운다)
  const [outcome, setOutcome] = useState<Outcome>({ kind: "running" });

  // 위치 권한이 허용된 뒤부터 위치를 계속 받는다. 완주·반려가 정해지면 바로 멈춘다 (PRD 7번: 운동이 끝나면 수집을 멈춘다)
  const watched = useWatchPosition(status === "granted" && outcome.kind === "running", course.path, scenario);
  // 정확도가 50m보다 나쁜 위치는 계산에 쓰지 않는다 (PRD 5번)
  const usable = watched && watched.accuracy <= GPS_ACCURACY_LIMIT_M ? watched : null;
  const [last, setLast] = useState<typeof usable>(null);
  const [trace, setTrace] = useState<[number, number][]>([]); // 지나온 위치 (기기 안에서만 사용)
  const [progress, setProgress] = useState<FollowProgress | null>(null);
  const [maxAlongKm, setMaxAlongKm] = useState(0); // 지금까지 코스 위에서 가장 멀리 간 거리 (되돌아가도 줄지 않는다)
  const [splitsMs, setSplitsMs] = useState<number[]>([]); // 1km씩 통과한 순간의 소요 시간
  const [cheer, setCheer] = useState<Cheer | null>(null);
  if (usable && usable !== last) {
    setLast(usable);
    setTrace((t) => [...t, [usable.lat, usable.lng]]);
    if (!reachedStart && distance(point([usable.lng, usable.lat]), point([course.startLng, course.startLat]), { units: "meters" }) <= START_TOLERANCE_M) {
      setReachedStart(true);
    }
    // 진행 거리는 직전 위치 근처에서 이어서 잰다 (순환 코스에서 출발점=도착점이라 진행이 100%로 튀지 않게)
    const p = followProgress(course.path, usable.lat, usable.lng, progress?.alongKm ?? 0);
    setProgress(p);
    const nextMax = Math.max(maxAlongKm, p.alongKm);
    if (nextMax > maxAlongKm) {
      setMaxAlongKm(nextMax);
      // 응원 알림: 1km 통과(이번 1km 구간 페이스), 절반 통과, 도착 200m 전
      const kmDone = Math.floor(nextMax);
      if (kmDone > splitsMs.length && kmDone >= 1) {
        const added = Array.from({ length: kmDone - splitsMs.length }, () => elapsedMs);
        const prevAt = splitsMs[splitsMs.length - 1] ?? 0;
        setSplitsMs([...splitsMs, ...added]);
        setCheer({ key: `km${kmDone}`, emoji: "🏃", title: `${kmDone}km 통과!`, sub: `이번 1km ${formatPace((elapsedMs - prevAt) / 1000)}`, at: realMs });
      }
      const half = p.totalKm / 2;
      if (maxAlongKm < half && nextMax >= half) {
        setCheer({ key: "half", emoji: "💪", title: "절반 왔어요!", sub: `남은 거리 ${formatDistanceKm(p.totalKm - nextMax)}, 이대로 쭉!`, at: realMs });
      }
      if (p.totalKm > 0.5 && p.totalKm - maxAlongKm > 0.2 && p.totalKm - nextMax <= 0.2) {
        setCheer({ key: "near", emoji: "🏁", title: "거의 다 왔어요!", sub: "도착까지 200m 남았어요", at: realMs });
      }
    }
  }

  // 위치 정확도가 나쁜 상태 (PLAN 14번): 그 점은 계산에서 빼고, 정확도가 좋아질 때까지 기록 확정을 보류한다
  const lowAccuracy = watched !== null && watched.accuracy > GPS_ACCURACY_LIMIT_M;

  // 완주 판정 (PLAN 15번): 도착 지점 30m 이내에 처음 들어오면 한 번 판정한다.
  // 정확도가 나쁜 동안에는 판정을 미룬다. (14번)
  // 순환 코스는 출발하자마자 도착 지점 안에 있으므로, 코스를 절반 이상 지난 뒤부터 판정한다.
  const end = course.path[course.path.length - 1];
  const loop = useMemo(() => isLoopCourse(course.path), [course.path]);
  const finishArmed = !loop || (progress !== null && maxAlongKm >= progress.totalKm / 2);
  const atFinish =
    usable !== null &&
    distance(point([usable.lng, usable.lat]), point([end[1], end[0]]), { units: "meters" }) <= FINISH_RADIUS_M;
  if (outcome.kind === "running" && finishArmed && atFinish && !lowAccuracy && usable && last === usable) {
    const result = judgeCompletion(course.path, trace);
    setOutcome(
      result.accepted
        ? { kind: "accepted", durationSec: Math.max(1, Math.round(elapsedMs / 1000)), attempt: 1 }
        : { kind: "rejected", reasons: result.reasons },
    );
  }

  // 완주 요약 저장 (PLAN 16번): 코스·소요 시간만 보낸다
  const acceptedKey = outcome.kind === "accepted" ? `${outcome.durationSec}-${outcome.attempt}` : null;
  // 같은 완주를 두 번 저장하지 않도록, 보낸 키를 기억해 둔다 (개발 모드는 효과를 두 번 실행한다)
  const sentKey = useRef<string | null>(null);
  useEffect(() => {
    if (!acceptedKey || sentKey.current === acceptedKey) return;
    sentKey.current = acceptedKey;
    const [durationSec] = acceptedKey.split("-").map(Number);
    fetch("/api/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: course.id, durationSec }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setOutcome({ kind: "saveFailed", durationSec, message: json?.error?.message ?? "완주 기록을 저장하지 못했습니다" });
          return;
        }
        router.push(`/courses/${course.id}/done?completion=${json.data.id}`);
      })
      .catch(() => {
        setOutcome({ kind: "saveFailed", durationSec, message: "네트워크 문제로 저장하지 못했습니다" });
      });
  }, [acceptedKey, course.id, router]);

  // 기록 끊김 (PLAN 13번): 위치가 한동안 들어오지 않으면 알린다
  const lastReceivedAt = useRef(0);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    lastReceivedAt.current = Date.now();
  }, [watched]);
  useEffect(() => {
    if (status !== "granted") return;
    lastReceivedAt.current = Date.now();
    const lostUntil = { current: 0 }; // 끊김 알림을 이 시각까지 보여 준다
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastReceivedAt.current > LOST_AFTER_MS) lostUntil.current = now + LOST_NOTICE_MS;
      setLost(now < lostUntil.current);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // 화면 켜짐 유지 요청 (지원하는 브라우저만). 화면이 꺼지면 위치 기록이 끊길 수 있다
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    };
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  // 코스에서 50m 넘게 벗어났는지 (PLAN 12번)
  const offRoute = progress !== null && progress.offRouteM > OFF_ROUTE_M;
  useEffect(() => {
    if (offRoute) navigator.vibrate?.(200); // 벗어나는 순간 한 번 진동 (지원하는 기기만)
  }, [offRoute]);

  // 지도 방향: 코스 위 지금 지점에서 앞으로 갈 방향이 화면 위쪽이 되게 한다
  const alongKm = progress?.alongKm ?? 0;
  const heading = useMemo(() => routeBearingAt(course.path, alongKm), [course.path, alongKm]);
  const totalKm = progress?.totalKm ?? course.distanceKm;
  const percent = Math.min(100, Math.round((alongKm / Math.max(totalKm, 0.001)) * 100));
  // 평균 페이스 (1km에 걸린 시간). 50m 이상 움직였을 때부터 보여 준다
  const paceSec = alongKm >= 0.05 ? elapsedMs / 1000 / alongKm : null;
  // 최고 기록과 비교: 최고 기록 때 같은 지점에 도착했을 시간(같은 빠르기로 달렸다고 보고)과 지금 시간의 차이. 100m 지난 뒤부터
  const gapSec = bestSec && alongKm >= 0.1 ? elapsedMs / 1000 - bestSec * (alongKm / Math.max(totalKm, 0.001)) : null;
  const showCheer = cheer !== null && realMs - cheer.at < CHEER_MS;

  // 반려: 코스를 잘 따르지 못한 이유를 알리고 저장하지 않는다
  if (outcome.kind === "rejected") {
    return (
      <div className="sheet-up flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-white px-5 text-center" role="alert">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl">🧭</div>
        <h2 className="text-2xl font-bold">완주로 인정되지 않았습니다</h2>
        <p className="text-sm text-foreground/60">코스를 잘 따라가지 못해서 기록을 저장하지 않았어요.</p>
        <ul className="w-full space-y-2 rounded-2xl bg-white p-4 text-left text-sm shadow-sm ring-1 ring-black/5">
          {outcome.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-amber-500">●</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <Link href={`/courses/${course.id}`} className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white">
          다시 도전하기
        </Link>
        <Link href="/" className="text-sm text-foreground/60 underline">
          코스 목록으로
        </Link>
      </div>
    );
  }

  // 저장 실패: 완주 기록을 잃지 않도록 다시 시도할 수 있게 한다
  if (outcome.kind === "saveFailed") {
    const { durationSec } = outcome;
    return (
      <div className="sheet-up flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-5 text-center" role="alert">
        <h2 className="text-2xl font-bold">완주했어요!</h2>
        <p className="text-amber-600">{outcome.message}</p>
        <button
          type="button"
          onClick={() => setOutcome({ kind: "accepted", durationSec, attempt: Date.now() })}
          className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-semibold text-white"
        >
          다시 저장하기
        </button>
      </div>
    );
  }

  const alerts: { key: string; tone: "red" | "amber" | "info"; title: string; sub?: string }[] = [];
  if (status === "denied") alerts.push({ key: "denied", tone: "red", title: "위치 권한을 허용해 주세요" });
  if (status === "unavailable" || status === "timeout" || status === "unsupported")
    alerts.push({ key: "nopos", tone: "amber", title: "현재 위치를 알 수 없어요" });
  if (status === "granted" && offStart && !reachedStart)
    alerts.push({ key: "start", tone: "red", title: "코스를 이탈했습니다", sub: `코스 시작점에서 ${START_TOLERANCE_M}m 넘게 떨어져 있어요` });
  if (offRoute && progress)
    alerts.push({ key: "off", tone: "red", title: "코스에서 벗어났어요", sub: `코스까지 약 ${Math.round(progress.offRouteM)}m` });
  if (lost) alerts.push({ key: "lost", tone: "amber", title: "기록이 끊겼습니다", sub: "화면이 꺼지면 위치를 받지 못해요" });
  if (lowAccuracy) alerts.push({ key: "acc", tone: "amber", title: "위치 정확도가 낮습니다", sub: "정확도가 좋아질 때까지 기록을 확정하지 않아요" });
  if (outcome.kind === "accepted") alerts.push({ key: "done", tone: "info", title: "완주! 기록을 저장하는 중이에요…" });

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#F4F8F5]">
      {/* 지도: 현재 위치를 따라가며 가는 방향이 위로 오게 돈다 */}
      <div className="absolute inset-0">
        <CourseMapLoader
          path={course.path}
          mode="follow"
          current={last ? [last.lat, last.lng] : null}
          heading={heading}
          progressKm={alongKm}
          padding={{ top: 330, bottom: 250, left: 40, right: 40 }} // 내 위치가 화면 아래쪽에 와서 앞길이 넓게 보이도록
          attribution={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/85 via-white/40 to-transparent" />

      {/* 위: 나가기(포기) · 나침반, 나침반 아래에 지도 출처(ⓘ) */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-4">
        <button
          type="button"
          onClick={() => setGiveUpAsk(true)}
          className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold shadow-lg ring-1 ring-black/5 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          나가기
        </button>
        <div className="flex flex-col items-end gap-2">
          <Compass heading={heading} />
          <MapAttribution />
        </div>
      </div>

      {/* 알림: 지도 위쪽에 차례로 띄운다. 응원 알림(1km 통과 등)은 잠깐 보였다가 사라진다 */}
      <div className="absolute inset-x-4 top-[112px] flex flex-col gap-2" aria-live="polite">
        {showCheer && cheer && (
          <div key={cheer.key} role="status" className="pop-in flex items-center gap-3 self-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-white shadow-lg shadow-emerald-600/30">
            <span className="text-2xl" aria-hidden="true">{cheer.emoji}</span>
            <div>
              <p className="font-bold leading-tight">{cheer.title}</p>
              <p className="text-xs opacity-90">{cheer.sub}</p>
            </div>
          </div>
        )}
        {alerts.map((a) => (
          <div
            key={a.key}
            role="alert"
            className={`sheet-up rounded-2xl px-4 py-2.5 text-sm shadow-lg ${
              a.tone === "red" ? "bg-red-600 text-white" : a.tone === "amber" ? "bg-amber-400 text-black" : "bg-emerald-600 text-white"
            }`}
          >
            <p className="font-semibold">{a.title}</p>
            {a.sub && <p className="text-xs opacity-90">{a.sub}</p>}
            {a.key === "denied" && (
              <button type="button" onClick={retry} className="mt-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                다시 시도
              </button>
            )}
          </div>
        ))}
        {status === "asking" && <p className="self-center rounded-full bg-white/90 px-3 py-1 text-xs shadow">현재 위치를 확인하는 중이에요…</p>}
      </div>

      {/* 아래: 운동 정보 */}
      <section aria-label="운동 정보" className="sheet-up absolute inset-x-0 bottom-0 px-3 pb-5">
        {/* 기록 중 표시: 운동 정보 카드 바로 위 가운데 */}
        <div className="mb-2 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow ring-1 ring-black/5 backdrop-blur">
            <span className="rec-dot h-2 w-2 rounded-full bg-red-500" /> 기록 중
            <span className="font-normal text-foreground/50">· 화면을 켜 두세요</span>
          </span>
        </div>
        <div className="rounded-3xl bg-white/95 p-4 shadow-[0_-4px_24px_rgb(0_0_0/0.12)] ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-foreground/50">남은 거리</p>
              <p className="text-5xl font-extrabold leading-none tracking-tight text-emerald-600" data-testid="remaining">
                {progress ? formatDistanceKm(progress.remainingKm).replace("km", "") : "-"}
                <span className="ml-1 text-xl font-bold text-emerald-600/70">km</span>
              </p>
            </div>
            <div className="flex max-w-[55%] flex-col items-end gap-1">
              <p className="max-w-full truncate text-right text-xs text-foreground/50">{course.name}</p>
              {/* 최고 기록과 비교 */}
              {gapSec !== null ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    Math.abs(gapSec) < 3 ? "bg-slate-100 text-slate-600" : gapSec < 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                  data-testid="best-gap"
                >
                  {Math.abs(gapSec) < 3 ? "🏅 최고 기록과 비슷해요" : `🏅 최고 기록보다 ${formatGap(gapSec)} ${gapSec < 0 ? "빨라요" : "느려요"}`}
                </span>
              ) : (
                !bestSec && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">첫 완주 도전 중</span>
              )}
            </div>
          </div>

          {/* 진행 막대: 지나온 만큼 채워지고 끝에 달리는 점이 있다 */}
          <div className="relative mt-3 h-2.5 rounded-full bg-emerald-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-700" style={{ width: `${percent}%` }} />
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-blue-600 shadow transition-[left] duration-700"
              style={{ left: `${percent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-foreground/50">
            <span>출발</span>
            <span>{percent}%</span>
            <span>도착</span>
          </div>

          <dl className="mt-3 grid grid-cols-3 divide-x divide-black/5 rounded-2xl bg-emerald-50/70 py-2.5 text-center">
            <div>
              <dt className="text-[11px] text-foreground/50">소요 시간</dt>
              <dd className="font-mono text-lg font-bold" data-testid="elapsed">
                {formatElapsed(elapsedMs)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-foreground/50">총 거리</dt>
              <dd className="text-lg font-bold">{formatDistanceKm(totalKm)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-foreground/50">평균 페이스</dt>
              <dd className="text-lg font-bold">{paceSec ? formatPace(paceSec) : "-"}</dd>
            </div>
          </dl>
          {isDemo && <p className="mt-2 text-center text-[11px] font-medium text-emerald-600">시연용 코스 주행 중이에요.</p>}
        </div>
      </section>

      {/* 운동 도중 나가기는 포기로 보고 기록을 저장하지 않는다 (PRD 5번) */}
      {giveUpAsk && (
        <BottomSheet title="운동을 그만둘까요?" onClose={() => setGiveUpAsk(false)}>
          <p className="mb-4 text-sm text-foreground/60">지금 나가면 포기로 처리되고 기록은 저장되지 않아요.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setGiveUpAsk(false)} className="h-14 flex-1 rounded-2xl bg-emerald-600 font-semibold text-white">
              계속 달리기
            </button>
            <button type="button" onClick={() => router.push(`/courses/${course.id}`)} className="h-14 flex-1 rounded-2xl bg-red-50 font-semibold text-red-600">
              포기하고 나가기
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// 나침반: 지도가 가는 방향으로 돌아가므로, 북쪽(N) 글자도 함께 돌아 실제 북쪽을 가리킨다. 가운데 화살표는 내가 가는 방향(위).
// 방향이 359도 → 1도처럼 0도를 넘을 때 한 바퀴 거꾸로 돌지 않도록, 늘 가까운 쪽으로만 돌린다. (지도도 가까운 쪽으로 돈다)
function Compass({ heading }: { heading: number }) {
  const dialRef = useRef<SVGSVGElement>(null);
  const turned = useRef(0); // 지금까지 돌린 각도 (360을 넘어 누적)
  useEffect(() => {
    const delta = ((((-heading - turned.current) % 360) + 540) % 360) - 180; // -180 ~ 180도 사이의 가까운 차이
    turned.current += delta;
    if (dialRef.current) dialRef.current.style.transform = `rotate(${turned.current}deg)`;
  }, [heading]);

  return (
    <div className="relative h-14 w-14 rounded-full bg-white shadow-lg ring-1 ring-black/5" aria-label={`나침반, 진행 방향 ${Math.round(heading)}도`} role="img">
      <svg ref={dialRef} viewBox="0 0 56 56" className="absolute inset-0 transition-transform duration-700 ease-out" aria-hidden="true">
        <circle cx="28" cy="28" r="24" fill="none" stroke="#E5EFEA" strokeWidth="2" />
        {[0, 90, 180, 270].map((d) => (
          <line key={d} x1="28" y1="5" x2="28" y2="9" stroke="#9DB8AA" strokeWidth="2" transform={`rotate(${d} 28 28)`} />
        ))}
        <text x="28" y="17" textAnchor="middle" fontSize="9" fontWeight="800" fill="#DC2626">N</text>
        <text x="28" y="48" textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748B">S</text>
        <text x="46" y="31" textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748B">E</text>
        <text x="10" y="31" textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748B">W</text>
      </svg>
      <svg viewBox="0 0 56 56" className="absolute inset-0" aria-hidden="true">
        <path d="M28 20 L33 34 L28 31 L23 34 Z" fill="#2563EB" />
      </svg>
    </div>
  );
}

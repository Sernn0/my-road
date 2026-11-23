"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { routeLengthKm } from "@/lib/geo/route";
import { formatDistanceKm } from "@/lib/format";
import { GPS_ACCURACY_LIMIT_M } from "@/lib/location/config";
import { useRouteRecorder } from "@/lib/location/useRouteRecorder";
import {
  MIN_COURSE_DISTANCE_KM,
  MIN_COURSE_POINTS,
  TOO_SHORT_MESSAGE,
} from "@/lib/courses/validate";

// 기본 코스 이름: "코스 11월 23일"
function defaultName(): string {
  const d = new Date();
  return `코스 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 코스 기록 화면: 경로를 모으고, "기록 마무리"로 이름을 정해 코스로 저장한다. (PLAN 4·5번)
export default function RecordingView({
  isDemo,
  onRestart,
}: {
  isDemo: boolean;
  onRestart: () => void;
}) {
  const router = useRouter();
  const [finished, setFinished] = useState(false); // 기록 마무리를 눌렀다 (경로 수집 중지)
  const { points, lowAccuracy, lost } = useRouteRecorder(!finished);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const distanceKm = routeLengthKm(points);
  const tooShort = points.length < MIN_COURSE_POINTS || distanceKm < MIN_COURSE_DISTANCE_KM;
  const last = points[points.length - 1];

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, path: points }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error?.message ?? "코스를 저장하지 못했습니다");
        return;
      }
      router.push("/");
    } catch {
      setMessage("네트워크 문제로 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  // 기록 마무리 후: 이름 입력과 저장
  if (finished) {
    return (
      <div className="flex w-full flex-col gap-4">
        <p className="text-center text-lg font-semibold">코스 이름을 정해 주세요</p>
        <p className="text-center text-sm text-foreground/60">
          {formatDistanceKm(distanceKm)} · 경로 점 {points.length}개
        </p>

        {tooShort ? (
          <p className="text-center text-sm text-amber-600" role="alert">
            {TOO_SHORT_MESSAGE}
          </p>
        ) : (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-label="코스 이름"
            className="h-14 w-full rounded-2xl border border-black/15 bg-background px-4 text-lg dark:border-white/20"
          />
        )}
        {message && (
          <p className="text-center text-sm text-amber-600" role="alert">
            {message}
          </p>
        )}

        {!tooShort && (
          <button
            type="button"
            onClick={save}
            disabled={saving || name.trim() === ""}
            className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="h-12 w-full rounded-2xl border border-black/15 font-medium dark:border-white/20"
        >
          다시 기록하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-4" role="status">
        <p className="text-lg font-semibold">지금 위치에서 코스 기록을 시작합니다</p>
        <p className="text-sm text-foreground/60">
          이동하는 동안 경로를 기록해요. 화면을 켜 두세요.
        </p>

        <div className="w-full rounded-2xl border border-black/10 px-4 py-4 dark:border-white/15">
          <p className="text-sm text-foreground/60">지금까지</p>
          <p className="text-3xl font-bold" data-testid="distance">
            {formatDistanceKm(distanceKm)}
          </p>
          <p className="mt-1 text-sm text-foreground/60" data-testid="point-count">
            경로 점 {points.length}개
          </p>
          {last && (
            <p className="mt-2 font-mono text-xs text-foreground/60">
              최근 위치 {last[0].toFixed(5)}, {last[1].toFixed(5)}
            </p>
          )}
        </div>

        {lowAccuracy && (
          <p className="text-sm text-amber-600">
            위치 정확도가 낮습니다. ({GPS_ACCURACY_LIMIT_M}m보다 나쁜 위치는 기록하지 않아요)
          </p>
        )}
        {lost && <p className="text-sm text-amber-600">위치를 받지 못하고 있어요.</p>}
        {isDemo && (
          <p className="text-sm font-medium text-emerald-600">시연용 가짜 위치로 기록 중이에요</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setFinished(true)}
        className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700"
      >
        기록 마무리
      </button>
    </div>
  );
}

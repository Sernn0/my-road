"use client";

import { GPS_ACCURACY_LIMIT_M } from "@/lib/location/config";
import { useRouteRecorder } from "@/lib/location/useRouteRecorder";

// 코스 기록 중 화면: 안내 문구와 수집 상태. (지도 표시와 "기록 마무리"는 PLAN 5·7번에서 추가)
export default function RecordingView({ isDemo }: { isDemo: boolean }) {
  const { points, lowAccuracy, lost } = useRouteRecorder(true);
  const last = points[points.length - 1];

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center" role="status">
      <p className="text-lg font-semibold">지금 위치에서 코스 기록을 시작합니다</p>
      <p className="text-sm text-foreground/60">
        이동하는 동안 경로를 기록해요. 화면을 켜 두세요.
      </p>

      <div className="w-full rounded-2xl border border-black/10 px-4 py-4 dark:border-white/15">
        <p className="text-sm text-foreground/60">기록한 경로 점</p>
        <p className="text-3xl font-bold" data-testid="point-count">
          {points.length}개
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
      {isDemo && <p className="text-sm font-medium text-emerald-600">시연용 가짜 위치로 기록 중이에요</p>}
    </div>
  );
}

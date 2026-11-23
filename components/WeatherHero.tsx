import { connection } from "next/server";
import WeatherScene, { type SceneKind } from "@/components/WeatherScene";
import { getWeather } from "@/lib/weather/kma";

// 메인 화면의 "대전 지금 날씨" 카드 (PRD 5번: 날씨는 대전만, 10분 이내 관측값만, 실패하면 값을 만들지 않고 안내만)
const DAEJEON = { lat: 36.3504, lng: 127.3845 }; // 대전시청 부근 (관측은 133번 지점)
const WINDY_MPS = 5;

export default async function WeatherHero() {
  await connection(); // 지금 시각의 날씨라서 요청할 때마다 그린다
  const weather = await getWeather(DAEJEON.lat, DAEJEON.lng);

  if (weather.status !== "ok") {
    return (
      <section aria-label="대전 지금 날씨" className="rounded-3xl border border-black/10 px-5 py-4 text-sm text-foreground/70">
        날씨 정보를 불러오지 못했습니다
      </section>
    );
  }

  const rain15 = weather.rain15mm ?? 0;
  const rain60 = weather.rain60mm ?? 0;
  const wind = weather.windMps ?? 0;
  const kind: SceneKind = rain15 > 0 || rain60 > 0 ? "rain" : wind >= WINDY_MPS ? "wind" : "calm";
  const headline =
    kind === "rain"
      ? rain15 > 0
        ? "비가 오고 있어요"
        : "1시간 안에 비가 왔어요"
      : kind === "wind"
        ? "바람이 강해요"
        : "비 없이 바람이 약해요";

  return (
    <section
      aria-label="대전 지금 날씨"
      className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-sky-50 px-4 py-4 ring-1 ring-black/5"
    >
      <WeatherScene kind={kind} tempC={weather.tempC} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground/60">대전 지금 · {weather.ageMin}분 전 관측</p>
        <p className="text-3xl font-bold leading-tight" data-testid="main-temp">
          {weather.tempC.toFixed(1)}°C
        </p>
        <p className="text-sm font-medium text-foreground/80">{headline}</p>
        <p className="mt-1 text-xs text-foreground/60">
          습도 {weather.humidity === null ? "-" : `${Math.round(weather.humidity)}%`} · 바람{" "}
          {weather.windMps === null ? "-" : `${weather.windMps.toFixed(1)}m/s`} · 15분 비 {rain15 > 0 ? `${rain15.toFixed(1)}mm` : "없음"}
        </p>
      </div>
    </section>
  );
}

export function WeatherHeroSkeleton() {
  return <div className="h-[120px] animate-pulse rounded-3xl bg-foreground/5" aria-label="날씨를 불러오는 중이에요" />;
}

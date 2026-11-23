import { connection } from "next/server";
import WeatherSky from "@/components/WeatherSky";
import { getWeather } from "@/lib/weather/kma";
import { sceneFor, type Scene } from "@/lib/weather/scene";

// 메인 화면의 "대전 지금 날씨" 카드 (PRD 5번: 날씨는 대전만, 10분 이내 관측값만, 실패하면 값을 만들지 않고 안내만)
// 배경 그림은 시간대와 실제 날씨 값(비·바람·습도·기온)에 따라 색과 장면이 바뀐다. (lib/weather/scene.ts)
const DAEJEON = { lat: 36.3504, lng: 127.3845 }; // 대전시청 부근 (관측은 133번 지점)

export function WeatherHeroView({
  scene,
  tempC,
  ageMin,
  humidity,
  windMps,
  rain15mm,
}: {
  scene: Scene;
  tempC: number;
  ageMin: number;
  humidity: number | null;
  windMps: number | null;
  rain15mm: number | null;
}) {
  const { text, subText } = scene.colors;
  const chip = scene.isNight ? "bg-white/15" : "bg-white/55";
  return (
    <section aria-label="대전 지금 날씨" className="relative h-[176px] overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
      <WeatherSky scene={scene} />
      <div className="relative flex h-full flex-col justify-between p-4" style={{ color: text }}>
        <div>
          <p className="text-xs font-medium" style={{ color: subText }}>
            대전 지금 · {ageMin}분 전 관측
          </p>
          <p className="text-4xl font-extrabold leading-tight tracking-tight drop-shadow-sm" data-testid="main-temp">
            {tempC.toFixed(1)}°
          </p>
          <p className="text-sm font-semibold">{scene.headline}</p>
          {scene.tip && (
            <p className="mt-0.5 text-xs" style={{ color: subText }}>
              {scene.tip}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 text-[11px] font-medium">
          <span className={`rounded-full px-2 py-0.5 backdrop-blur ${chip}`}>습도 {humidity === null ? "-" : `${Math.round(humidity)}%`}</span>
          <span className={`rounded-full px-2 py-0.5 backdrop-blur ${chip}`}>바람 {windMps === null ? "-" : `${windMps.toFixed(1)}m/s`}</span>
          <span className={`rounded-full px-2 py-0.5 backdrop-blur ${chip}`}>
            15분 비 {rain15mm && rain15mm > 0 ? `${rain15mm.toFixed(1)}mm` : "없음"}
          </span>
        </div>
      </div>
    </section>
  );
}

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

  return (
    <WeatherHeroView
      scene={sceneFor(weather)}
      tempC={weather.tempC}
      ageMin={weather.ageMin}
      humidity={weather.humidity}
      windMps={weather.windMps}
      rain15mm={weather.rain15mm}
    />
  );
}

export function WeatherHeroSkeleton() {
  return <div className="h-[176px] animate-pulse rounded-3xl bg-foreground/5" aria-label="날씨를 불러오는 중이에요" />;
}

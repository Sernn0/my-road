import { connection } from "next/server";
import { getWeather } from "@/lib/weather/kma";

// 날씨 카드. 요청할 때마다 서버에서 불러온다. (대전만, 10분 이내 관측값만. 실패하면 값을 만들지 않고 안내만)
export default async function WeatherCard({ lat, lng }: { lat: number; lng: number }) {
  await connection(); // 현재 시각을 쓰므로 요청 시점에 그린다
  const weather = await getWeather(lat, lng);

  const box = "rounded-2xl border border-black/10 px-4 py-4 dark:border-white/15";

  if (weather.status === "out_of_region") {
    return <p className={`${box} text-sm text-foreground/70`}>날씨는 대전 지역만 제공합니다</p>;
  }
  if (weather.status === "unavailable") {
    return <p className={`${box} text-sm text-foreground/70`}>날씨 정보를 불러오지 못했습니다</p>;
  }

  const rain = weather.rain15mm ?? 0;
  return (
    <div className={box}>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold">{weather.tempC.toFixed(1)}°C</p>
        <p className="text-sm text-foreground/60">대전 관측 · {weather.ageMin}분 전</p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <dt className="text-foreground/60">습도</dt>
          <dd className="font-medium">{weather.humidity === null ? "-" : `${Math.round(weather.humidity)}%`}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">바람</dt>
          <dd className="font-medium">{weather.windMps === null ? "-" : `${weather.windMps.toFixed(1)}m/s`}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">최근 15분 비</dt>
          <dd className="font-medium">{rain > 0 ? `${rain.toFixed(1)}mm` : "없음"}</dd>
        </div>
      </dl>
    </div>
  );
}

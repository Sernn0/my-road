import { connection } from "next/server";
import { getWeather } from "@/lib/weather/kma";

// 출발 전 확인 화면의 날씨 한 줄 (자세한 날씨는 메인 화면에 있다).
// PRD 5번: 경로·거리·날씨를 한 화면에서 보여 준다. 대전 밖 코스와 실패는 값을 만들지 않고 안내만 한다.
export default async function WeatherCard({ lat, lng }: { lat: number; lng: number }) {
  await connection(); // 현재 시각을 쓰므로 요청 시점에 그린다
  const weather = await getWeather(lat, lng);

  const box = "flex items-baseline justify-between";
  const label = <span className="text-sm text-foreground/60">날씨</span>;

  if (weather.status === "out_of_region") {
    return (
      <div className={box}>
        {label}
        <span className="text-sm text-foreground/70">날씨는 대전 지역만 제공합니다</span>
      </div>
    );
  }
  if (weather.status === "unavailable") {
    return (
      <div className={box}>
        {label}
        <span className="text-sm text-foreground/70">날씨 정보를 불러오지 못했습니다</span>
      </div>
    );
  }

  const rain = weather.rain15mm ?? 0;
  return (
    <div className={box}>
      {label}
      <span className="text-sm">
        <span className="text-lg font-bold">{weather.tempC.toFixed(1)}°C</span>
        <span className="text-foreground/70"> · {rain > 0 ? `비 ${rain.toFixed(1)}mm` : "비 없음"} · {weather.ageMin}분 전</span>
      </span>
    </div>
  );
}

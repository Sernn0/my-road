import { getWeather } from "@/lib/weather/kma";

// 날씨 조회 (DESIGN.md 5번). 코스 시작점의 위도·경도를 받는다.
// 응답: { data: { status: "ok" | "out_of_region" | "unavailable", ... } }
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!params.get("lat") || !params.get("lng") || Math.abs(lat) > 90 || Math.abs(lng) > 180 || Number.isNaN(lat) || Number.isNaN(lng)) {
    return Response.json({ error: { code: "INVALID_POSITION", message: "위도와 경도가 올바르지 않습니다" } }, { status: 400 });
  }
  return Response.json({ data: await getWeather(lat, lng) });
}

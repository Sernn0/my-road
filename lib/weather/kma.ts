import "server-only";

// 대전 날씨 (PLAN 8번). 기상청 API허브 AWS 매분자료의 대전 133번 지점을 쓴다. (DESIGN.md 6번, 호출 검증 완료)
// 10분 이내 관측값만 쓰고, 불러오지 못하면 값을 만들어 내지 않는다. (PRD 5번)

const STATION = 133; // 대전 (유성구 구성동)
export const MAX_AGE_MIN = 10; // 관측 후 10분이 지난 값은 쓰지 않는다
const REUSE_MIN = 3; // 이 시간 안에 받은 값은 다시 호출하지 않고 재사용한다 (호출 한도 보호)

export type Weather =
  | {
      status: "ok";
      observedAt: string; // 관측 시각 (ISO)
      ageMin: number; // 관측한 지 몇 분 지났는지 (조회한 순간 기준)
      fetchedAt: string; // 서버가 받아온 시각 (ISO)
      tempC: number;
      humidity: number | null;
      windMps: number | null;
      rain15mm: number | null;
      rain60mm: number | null;
    }
  | { status: "out_of_region" } // 대전 밖 코스
  | { status: "unavailable" }; // 불러오기 실패 또는 10분 넘은 값

// 대전 범위(대략적인 사각형). 코스 시작점 기준으로 대전 안인지 판단한다.
export function isInDaejeon(lat: number, lng: number): boolean {
  return lat >= 36.19 && lat <= 36.51 && lng >= 127.24 && lng <= 127.58;
}

// -99.9 같은 "값 없음" 표시는 null로 바꾼다
function num(value: string | undefined): number | null {
  const n = Number(value);
  return value === undefined || Number.isNaN(n) || n <= -9 ? null : n;
}

// 관측 시각 "YYYYMMDDHHMI"(한국 시간)을 Date로 바꾼다
function parseKst(s: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5]));
}

function formatKst(date: Date): string {
  const k = new Date(date.getTime() + 9 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}${p(k.getUTCMonth() + 1)}${p(k.getUTCDate())}${p(k.getUTCHours())}${p(k.getUTCMinutes())}`;
}

// 응답 한 줄 예: 202611231957 133 115.7 1.4 111.6 2.2 163.5 1.0 10.6 -99.9 0.1 0.6 6.1 6.1 97.7 1010.1 1018.3 10.3
// 열 순서: 시각 지점 WD1 WS1 WDS WSS WD10 WS10 TA RE RN-15m RN-60m RN-12H RN-DAY HM PA PS TD
export function parseAwsMin(text: string, now: Date, fetchedAt: Date): Weather | null {
  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && /^\d{12}\s/.test(l));
  if (!line) return null;
  const c = line.split(/\s+/);
  if (Number(c[1]) !== STATION) return null;
  const observed = parseKst(c[0]);
  const tempC = num(c[8]);
  if (!observed || tempC === null) return null;
  if (now.getTime() - observed.getTime() > MAX_AGE_MIN * 60_000) return null; // 10분 넘은 값
  return {
    status: "ok",
    observedAt: observed.toISOString(),
    ageMin: Math.max(0, Math.round((now.getTime() - observed.getTime()) / 60000)),
    fetchedAt: fetchedAt.toISOString(),
    tempC,
    humidity: num(c[14]),
    windMps: num(c[3]),
    rain15mm: num(c[10]),
    rain60mm: num(c[11]),
  };
}

let cached: Weather | null = null; // 서버 메모리에 잠깐 보관 (서버가 다시 시작되면 사라진다)

async function fetchDaejeon(): Promise<Weather> {
  const key = process.env.KMA_API_KEY;
  if (!key) return { status: "unavailable" };

  const now = new Date();
  if (cached && cached.status === "ok") {
    const fetchedAgo = now.getTime() - new Date(cached.fetchedAt).getTime();
    const observedAgo = now.getTime() - new Date(cached.observedAt).getTime();
    if (fetchedAgo < REUSE_MIN * 60_000 && observedAgo <= MAX_AGE_MIN * 60_000) return cached;
  }

  // 방금 시각은 자료가 아직 없을 수 있고 기상청 서버가 가끔 느려서,
  // 2분·5분·9분 전 시각을 한꺼번에 물어보고(최대 5초) 받은 것 중 가장 최근 관측값을 쓴다.
  const results = await Promise.all(
    [2, 5, 9].map(async (back) => {
      const tm2 = formatKst(new Date(now.getTime() - back * 60_000));
      const url =
        "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?" +
        new URLSearchParams({ tm2, stn: String(STATION), disp: "0", help: "0", authKey: key });
      try {
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
        return res.ok ? parseAwsMin(await res.text(), new Date(), new Date()) : null;
      } catch {
        return null;
      }
    }),
  );
  const fresh = results
    .filter((w): w is Extract<Weather, { status: "ok" }> => w?.status === "ok")
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0];
  if (fresh) {
    cached = fresh;
    return fresh;
  }
  // 이번에 못 받았어도, 전에 받아 둔 값이 아직 10분 이내 관측이면 그 값을 쓴다 (값을 지어내지는 않는다)
  if (cached?.status === "ok" && Date.now() - new Date(cached.observedAt).getTime() <= MAX_AGE_MIN * 60_000) {
    return cached;
  }
  return { status: "unavailable" };
}

// 코스 시작점 기준 날씨. 대전 밖이면 out_of_region, 실패하면 unavailable.
export async function getWeather(lat: number, lng: number): Promise<Weather> {
  if (!isInDaejeon(lat, lng)) return { status: "out_of_region" };
  const weather = await fetchDaejeon();
  if (weather.status !== "ok") return weather;
  // 재사용한 값일 수 있어서, 관측 후 지난 시간은 지금 기준으로 다시 계산한다
  const ageMin = Math.max(0, Math.round((Date.now() - new Date(weather.observedAt).getTime()) / 60000));
  return { ...weather, ageMin };
}

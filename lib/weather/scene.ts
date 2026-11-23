import type { Weather } from "@/lib/weather/kma";

// 날씨 카드 그림을 정하는 규칙. 실제로 잰 값(비·바람·습도·기온)과 지금 시각(한국 시간)만 쓴다.
// 대전 관측 자료에는 "맑음·흐림" 같은 하늘 상태가 없어서, 해·달은 "지금 시간대"를 보여 주는 표시로만 쓰고
// 구름은 비가 오거나(왔거나) 습도가 아주 높을 때만 그린다.

export type Phase = "dawn" | "morning" | "day" | "sunset" | "evening" | "night";

export type Scene = {
  phase: Phase;
  isNight: boolean;
  rainLevel: 0 | 1 | 2 | 3; // 0 없음, 1 약함, 2 보통, 3 강함 (최근 15분 강수량)
  rainedRecently: boolean; // 15분 안에는 없지만 1시간 안에 비가 왔다
  windy: boolean; // 초속 5m 이상
  humid: boolean; // 습도 90% 이상 (비가 아닐 때 옅은 안개 띠)
  temp: "cold" | "mild" | "hot";
  arc: number; // 해(낮) 또는 달(밤)이 하늘 길에서 어디쯤인지 0~1
  headline: string;
  tip: string | null;
  colors: { skyTop: string; skyBottom: string; ground: string; groundFar: string; text: string; subText: string };
};

const SKY: Record<Phase, { top: string; bottom: string; ground: string; far: string; dark: boolean }> = {
  dawn: { top: "#F9A8D4", bottom: "#FDE68A", ground: "#86C9A0", far: "#B7DDC4", dark: false },
  morning: { top: "#7DD3FC", bottom: "#E0F2FE", ground: "#6CC08F", far: "#A7DBBB", dark: false },
  day: { top: "#38BDF8", bottom: "#BAE6FD", ground: "#4FB37A", far: "#93D2AC", dark: false },
  sunset: { top: "#F97316", bottom: "#FBCFE8", ground: "#7A9E6E", far: "#C4A98C", dark: false },
  evening: { top: "#4338CA", bottom: "#C084FC", ground: "#3B4C6B", far: "#5B5F95", dark: true },
  night: { top: "#0B1026", bottom: "#1E2A5A", ground: "#16233F", far: "#243458", dark: true },
};

// 비 올 때는 하늘을 회색빛으로 바꾼다 (밤에는 어두운 회청색)
const RAIN_SKY = {
  light: { top: "#94A3B8", bottom: "#E2E8F0", ground: "#6B8F7B", far: "#A3B8AC" },
  dark: { top: "#1E293B", bottom: "#475569", ground: "#1F2E3A", far: "#334155" },
};

export function phaseOf(hour: number): Phase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "sunset";
  if (hour >= 19 && hour < 21) return "evening";
  return "night";
}

export function sceneFor(weather: Extract<Weather, { status: "ok" }>, now: number = Date.now()): Scene {
  const kst = new Date(now + 9 * 3_600_000);
  const hour = kst.getUTCHours() + kst.getUTCMinutes() / 60;
  const phase = phaseOf(Math.floor(hour));
  const isNight = phase === "evening" || phase === "night";
  // 해는 6시~19시, 달은 19시~다음날 6시 동안 하늘을 가로지른다
  const arc = isNight ? (((hour - 19 + 24) % 24) / 11) : Math.min(Math.max((hour - 6) / 13, 0), 1);

  const rain15 = weather.rain15mm ?? 0;
  const rain60 = weather.rain60mm ?? 0;
  const rainLevel: Scene["rainLevel"] = rain15 <= 0 ? 0 : rain15 < 0.5 ? 1 : rain15 < 2 ? 2 : 3;
  const rainedRecently = rainLevel === 0 && rain60 > 0;
  const windy = (weather.windMps ?? 0) >= 5;
  const humid = rainLevel === 0 && (weather.humidity ?? 0) >= 90;
  const temp = weather.tempC <= 3 ? "cold" : weather.tempC >= 28 ? "hot" : "mild";

  const greet: Record<Phase, string> = {
    dawn: "새벽이에요",
    morning: "아침이에요",
    day: "한낮이에요",
    sunset: "해 질 무렵이에요",
    evening: "저녁이에요",
    night: "밤이에요",
  };
  const headline =
    rainLevel === 3
      ? "강한 비가 와요"
      : rainLevel === 2
        ? "비가 와요"
        : rainLevel === 1
          ? "약한 비가 와요"
          : rainedRecently
            ? "비가 막 그쳤어요"
            : windy
              ? "바람이 강하게 불어요"
              : humid
                ? `${greet[phase]} · 습도가 높아요`
                : `${greet[phase]} · 비 소식은 없어요`;

  // 운동할 때 도움이 되는 한마디 (실제 값에서만 나온다)
  const tip =
    rainLevel > 0
      ? "길이 미끄러워요. 천천히 달려요"
      : rainedRecently
        ? "젖은 길을 조심하세요"
        : temp === "hot"
          ? "더워요. 물을 꼭 챙기세요"
          : temp === "cold"
            ? "추워요. 몸을 충분히 풀고 출발해요"
            : windy
              ? "맞바람 구간은 페이스를 낮춰요"
              : isNight
                ? "어두워요. 밝은 옷을 입어요"
                : null;

  const base = SKY[phase];
  const wet = rainLevel > 0 || rainedRecently;
  const sky = wet ? (isNight ? RAIN_SKY.dark : RAIN_SKY.light) : { top: base.top, bottom: base.bottom, ground: base.ground, far: base.far };
  const darkText = isNight || (wet && isNight);
  return {
    phase,
    isNight,
    rainLevel,
    rainedRecently,
    windy,
    humid,
    temp,
    arc,
    headline,
    tip,
    colors: {
      skyTop: sky.top,
      skyBottom: sky.bottom,
      ground: sky.ground,
      groundFar: sky.far,
      text: darkText ? "#FFFFFF" : "#0F172A",
      subText: darkText ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.68)",
    },
  };
}

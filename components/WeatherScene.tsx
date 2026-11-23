// 지금 날씨를 보여 주는 작은 움직이는 그림 (그림 파일 없이 SVG + CSS 애니메이션)
// 대전 관측 자료에는 "맑음·흐림" 같은 하늘 상태가 없어서, 실제로 잰 값(비·바람·기온)만 그림으로 나타낸다.
//   rain: 최근 15분·60분 사이 비가 왔다 → 구름에서 빗방울이 떨어진다
//   wind: 바람이 초속 5m 이상 → 바람 줄기가 지나간다
//   calm: 비가 없고 바람이 약하다 → 기온 색의 공기 방울이 천천히 떠오른다 (추움 파랑, 선선 초록, 더움 주황)

export type SceneKind = "rain" | "wind" | "calm";

export function tempTone(tempC: number): { fill: string; soft: string } {
  if (tempC < 5) return { fill: "#3B82F6", soft: "#DBEAFE" };
  if (tempC >= 25) return { fill: "#F97316", soft: "#FFEDD5" };
  return { fill: "#10B981", soft: "#D1FAE5" };
}

export default function WeatherScene({ kind, tempC, size = 88 }: { kind: SceneKind; tempC: number; size?: number }) {
  const tone = tempTone(tempC);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0 overflow-visible">
      <circle cx="50" cy="50" r="46" fill={kind === "rain" ? "#E0EAF5" : tone.soft} />

      {kind === "rain" && (
        <>
          <g className="wx-cloud">
            <circle cx="38" cy="42" r="14" fill="#94A3B8" />
            <circle cx="55" cy="36" r="17" fill="#A3B1C2" />
            <circle cx="68" cy="45" r="11" fill="#94A3B8" />
            <rect x="30" y="42" width="46" height="13" rx="6.5" fill="#94A3B8" />
          </g>
          {[34, 44, 54, 64, 72].map((x, i) => (
            <line
              key={x}
              x1={x}
              y1="60"
              x2={x - 3}
              y2="70"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeLinecap="round"
              className="wx-drop"
              style={{ animationDelay: `${i * 0.22}s` }}
            />
          ))}
        </>
      )}

      {kind === "wind" && (
        <g fill="none" stroke={tone.fill} strokeWidth="4" strokeLinecap="round">
          <path className="wx-gust" d="M18 38 H62 a9 9 0 1 0 -9 -9" />
          <path className="wx-gust" style={{ animationDelay: "0.35s" }} d="M14 54 H74 a10 10 0 1 1 -10 10" />
          <path className="wx-gust" style={{ animationDelay: "0.7s" }} d="M24 70 H52" />
        </g>
      )}

      {kind === "calm" && (
        <>
          <circle cx="50" cy="54" r="18" fill={tone.fill} opacity="0.85" className="wx-breathe" />
          {[
            [34, 70, 0],
            [62, 74, 0.8],
            [48, 78, 1.6],
            [70, 64, 2.2],
            [28, 60, 2.9],
          ].map(([x, y, d]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={tone.fill} className="wx-float" style={{ animationDelay: `${d}s` }} />
          ))}
        </>
      )}
    </svg>
  );
}

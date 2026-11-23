import type { Scene } from "@/lib/weather/scene";

// 날씨 카드 배경 그림 (그림 파일 없이 SVG + CSS 애니메이션). 시간대와 실제 날씨 값에 따라 색과 장면이 바뀐다.
//   하늘 색: 새벽(분홍·노랑) · 아침(하늘색) · 한낮(파랑) · 해 질 무렵(주황·분홍) · 저녁(보라) · 밤(남색), 비 오면 회색빛
//   해·달: 지금 시간대에 맞는 하늘 위치 (맑음을 뜻하지 않는다. 비가 오면 구름 뒤로 흐리게)
//   밤: 별이 반짝이고 먼 건물 창에 불이 켜진다
//   비: 구름이 흐르고, 비 세기에 따라 빗방울 수와 속도가 달라진다 (바람이 세면 비스듬히)
//   바람: 바람 줄기가 지나가고 나무가 흔들린다 / 습도 높음: 옅은 안개 띠 / 더움: 땅 위 아지랑이

const W = 360;
const H = 170;

// 매번 같은 결과가 나오는 간단한 난수 (그림이 새로고침마다 바뀌지 않게)
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

function Cloud({ x, y, s, fill, delay }: { x: number; y: number; s: number; fill: string; delay: number }) {
  return (
    <g className="wx-drift" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="10" rx="34" ry="12" fill={fill} />
        <circle cx="-14" cy="2" r="14" fill={fill} />
        <circle cx="8" cy="-4" r="18" fill={fill} />
        <circle cx="26" cy="6" r="11" fill={fill} />
      </g>
    </g>
  );
}

export default function WeatherSky({ scene }: { scene: Scene }) {
  const { colors, phase, isNight, rainLevel, rainedRecently, windy, humid, temp, arc } = scene;
  const wet = rainLevel > 0 || rainedRecently;
  const rand = seeded(7);

  // 해·달 위치: 글자를 가리지 않도록 오른쪽 하늘에서 반원을 그리며 움직인다
  const bx = 196 + arc * 136;
  const by = 118 - Math.sin(Math.PI * arc) * 84;
  // 같은 화면에 그림이 여러 개여도 색이 섞이지 않게 장면마다 이름을 다르게 붙인다
  const id = `wx-${phase}-${rainLevel}-${rainedRecently ? 1 : 0}-${humid ? 1 : 0}`;
  const sunColor = phase === "dawn" || phase === "sunset" ? "#FB923C" : "#FDE047";

  const drops = [0, 10, 20, 34][rainLevel];
  const slant = windy ? -7 : -2;
  const dropDur = [0, 1.3, 0.95, 0.7][rainLevel];
  const cloudFill = isNight ? "#475569" : wet ? "#CBD5E1" : "#FFFFFF";
  const cloudFill2 = isNight ? "#334155" : wet ? "#94A3B8" : "#F1F5F9";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.skyTop} />
          <stop offset="100%" stopColor={colors.skyBottom} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor={isNight ? "#F8FAFC" : sunColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={isNight ? "#F8FAFC" : sunColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />

      {/* 밤하늘 별 (비가 오지 않을 때) */}
      {isNight &&
        !wet &&
        Array.from({ length: 16 }, (_, i) => {
          const x = 10 + rand() * (W - 20);
          const y = 8 + rand() * 80;
          return <circle key={i} cx={x} cy={y} r={rand() > 0.7 ? 1.6 : 1} fill="#FFFFFF" className="wx-twinkle" style={{ animationDelay: `${(i % 6) * 0.5}s` }} />;
        })}

      {/* 해 또는 달 */}
      <g opacity={wet ? 0.35 : 1}>
        <circle cx={bx} cy={by} r="34" fill={`url(#${id}-glow)`} />
        {isNight ? (
          <g>
            <circle cx={bx} cy={by} r="13" fill="#F8FAFC" />
            <circle cx={bx + 6} cy={by - 4} r="11" fill={colors.skyTop} />
          </g>
        ) : (
          <g>
            <g className="wx-spin" style={{ transformOrigin: `${bx}px ${by}px` }}>
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return (
                  <line
                    key={i}
                    x1={bx + Math.cos(a) * 19}
                    y1={by + Math.sin(a) * 19}
                    x2={bx + Math.cos(a) * 25}
                    y2={by + Math.sin(a) * 25}
                    stroke={sunColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
            <circle cx={bx} cy={by} r="14" fill={sunColor} />
          </g>
        )}
      </g>

      {/* 구름: 비가 오거나 왔을 때, 또는 습도가 아주 높을 때 */}
      {(wet || humid) && (
        <g>
          <Cloud x={214} y={38} s={1} fill={cloudFill2} delay={0} />
          <Cloud x={290} y={26} s={1.25} fill={cloudFill} delay={-3} />
          {wet && <Cloud x={338} y={48} s={0.85} fill={cloudFill2} delay={-6} />}
          {rainLevel >= 2 && <Cloud x={176} y={24} s={0.9} fill={cloudFill} delay={-2} />}
        </g>
      )}

      {/* 비 */}
      {Array.from({ length: drops }, (_, i) => {
        const x = 168 + rand() * (W - 176); // 글자 쪽(왼쪽)은 비워 둔다
        const y = 52 + rand() * 30;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x + slant}
            y2={y + 11}
            stroke={isNight ? "#93C5FD" : "#2563EB"}
            strokeOpacity="0.75"
            strokeWidth="2"
            strokeLinecap="round"
            className="wx-rain"
            style={{ animationDelay: `${(rand() * dropDur).toFixed(2)}s`, animationDuration: `${dropDur}s` }}
          />
        );
      })}

      {/* 먼 언덕과 도시 */}
      <path d={`M0 128 Q60 104 120 120 T240 112 T360 118 V${H} H0Z`} fill={colors.groundFar} />
      <g fill={colors.groundFar} opacity="0.95">
        {[
          [196, 96, 12, 24],
          [211, 88, 10, 32],
          [224, 100, 14, 20],
          [241, 92, 9, 28],
          [253, 102, 12, 18],
        ].map(([x, y, w, h]) => (
          <rect key={x} x={x} y={y} width={w} height={h} rx="1.5" />
        ))}
      </g>
      {isNight &&
        [
          [199, 102],
          [214, 95],
          [214, 106],
          [228, 106],
          [244, 99],
          [256, 108],
        ].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill="#FDE68A" className="wx-twinkle" style={{ animationDuration: "4s" }} />)}

      {/* 안개 띠 (습도 높음) */}
      {humid && (
        <g fill="#FFFFFF" opacity={isNight ? 0.18 : 0.45}>
          <rect x="-40" y="104" width="220" height="9" rx="4.5" className="wx-mist" />
          <rect x="120" y="118" width="260" height="8" rx="4" className="wx-mist" style={{ animationDelay: "-4s" }} />
        </g>
      )}

      {/* 가까운 언덕, 산책로, 나무 */}
      <path d={`M0 142 Q90 122 180 138 T360 134 V${H} H0Z`} fill={colors.ground} />
      <path d="M-10 160 Q90 140 180 152 T370 146" fill="none" stroke="#FFFFFF" strokeOpacity={isNight ? 0.25 : 0.6} strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" />
      {[
        [58, 132],
        [86, 128],
        [300, 132],
      ].map(([x, y], i) => (
        <g key={x} className={windy ? "wx-sway" : undefined} style={{ transformOrigin: `${x}px ${y + 14}px`, animationDelay: `${i * 0.3}s` }}>
          <rect x={x - 1.5} y={y + 4} width="3" height="10" fill={isNight ? "#0F172A" : "#5B4636"} />
          <circle cx={x} cy={y} r="8" fill={isNight ? "#1E3A2F" : "#2F855A"} />
        </g>
      ))}

      {/* 바람 줄기 */}
      {windy && (
        <g fill="none" stroke={isNight ? "#CBD5E1" : "#FFFFFF"} strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round">
          <path className="wx-gust" d="M180 60 H270 a8 8 0 1 0 -8 -8" />
          <path className="wx-gust" style={{ animationDelay: "0.5s" }} d="M200 80 H320 a9 9 0 1 1 -9 9" />
          <path className="wx-gust" style={{ animationDelay: "1s" }} d="M230 98 H340" />
        </g>
      )}

      {/* 아지랑이 (더움) */}
      {temp === "hot" && !wet && (
        <g fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.5">
          {[150, 200, 250].map((x, i) => (
            <path key={x} d={`M${x} 130 q4 -6 0 -12 q-4 -6 0 -12`} className="wx-rise" style={{ animationDelay: `${i * 0.6}s` }} />
          ))}
        </g>
      )}
    </svg>
  );
}

// 마이로드 로고 (그림 파일 없이 SVG로 그린다). 서버 이미지 생성기(기록 이미지)에서도 쓸 수 있게 화면 전용 기능은 쓰지 않는다.
//   글자 로고: "마이로드"를 굵고 둥근 선으로 직접 그렸다. 글자 안에 코스 이야기를 담았다.
//     이의 ㅇ = 출발점(초록 점), 로의 ㄹ = 굽이진 길(가운데 점선), 드의 ㅡ 끝 = 도착점(빨간 점)
//   심볼: 둥근 사각형 안에 굽이진 길(ㄹ)과 출발·도착 점. 앱 아이콘(app/icon.svg)과 같은 모양이다.

const INK = "#0F172A"; // 글자색
const ROAD = "#059669"; // 길 색
const START = "#10B981";
const FINISH = "#EF4444";

// 글자 로고 (가로:세로 = 420:100). animate를 켜면 길이 그려지듯 나타난다. (globals.css의 .logo-draw)
export function LogoWordmark({ height = 48, ink = INK, animate = false }: { height?: number; ink?: string; animate?: boolean }) {
  const line = { fill: "none", stroke: ink, strokeWidth: 13, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg width={(height * 420) / 100} height={height} viewBox="0 0 420 100" role="img" aria-label="마이로드">
      {/* 마 */}
      <rect x="10" y="24" width="46" height="52" rx="9" {...line} />
      <path d="M78 10V90M78 50H96" {...line} />
      {/* 이: ㅇ은 출발점 */}
      <circle cx="140" cy="50" r="24" {...line} />
      <circle cx="140" cy="50" r="7" fill={START} />
      <path d="M186 10V90" {...line} />
      {/* 로: ㄹ은 굽이진 길 */}
      <path
        d="M226 10H292V30H230V50H298"
        fill="none"
        stroke={ROAD}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className={animate ? "logo-draw" : undefined}
      />
      <path
        d="M226 10H292V30H230V50H298"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeDasharray="5 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "logo-dash" : undefined}
      />
      <path d="M262 62V84M218 86H306" {...line} />
      {/* 드: ㅡ 끝은 도착점 */}
      <path d="M402 12H334V54H402M324 86H402" {...line} />
      <circle cx="404" cy="86" r="9" fill={FINISH} stroke="#FFFFFF" strokeWidth="3.5" className={animate ? "logo-pop" : undefined} />
    </svg>
  );
}

// 심볼 (정사각형). 앱 아이콘과 같은 모양
export function LogoMark({ size = 48, id = "mr" }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="마이로드 로고">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}-bg)`} />
      <path d="M15 17H47V31H17V45H49" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 17H47V31H17V45H49" fill="none" stroke="#059669" strokeWidth="1.6" strokeDasharray="3 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="17" r="5" fill="#FDE047" stroke="#047857" strokeWidth="2" />
      <circle cx="49" cy="45" r="5.5" fill={FINISH} stroke="#FFFFFF" strokeWidth="2.2" />
    </svg>
  );
}

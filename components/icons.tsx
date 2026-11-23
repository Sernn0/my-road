// 작은 아이콘 모음 (그림 파일 없이 SVG로 그린다)

// 레벨 뱃지: 방패 모양에 레벨 숫자. 레벨마다 색이 다르다.
const LEVEL_COLORS = ["#84CC16", "#0EA5E9", "#8B5CF6", "#F59E0B", "#F43F5E"];

export function LevelBadge({ level, size = 18 }: { level: number; size?: number }) {
  const color = LEVEL_COLORS[Math.min(Math.max(level, 1), 5) - 1];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d="M12 1.5 21 5v6.2c0 5.4-3.8 9.7-9 11.3-5.2-1.6-9-5.9-9-11.3V5l9-3.5Z" fill={color} />
      <path d="M12 3.6 19 6.4v4.8c0 4.3-2.9 7.7-7 9.1" fill="#fff" opacity="0.18" />
      <text x="12" y="15.6" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">
        {level}
      </text>
    </svg>
  );
}

// 불꽃: 연속 달성(streak) 표시. 연속 기록이 없으면 회색.
export function Flame({ active = true, size = 18 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        d="M12 23a7.5 7.5 0 0 0 7.5-7.5c0-4.2-2.8-6.9-4.5-9.1-.6 2.1-1.7 3.2-3 3.7.3-3.6-1.5-7-4.3-9.6-.4 4.3-2.6 6.8-3.9 9A9 9 0 0 0 4.5 15.5 7.5 7.5 0 0 0 12 23Z"
        fill={active ? "#F97316" : "#9CA3AF"}
      />
      <path
        d="M12 21a3.6 3.6 0 0 0 3.6-3.6c0-2-1.3-3.3-2.2-4.4-.3 1-.8 1.6-1.5 1.8.1-1.7-.7-3.3-2-4.6-.2 2-1.2 3.3-1.9 4.3a4.3 4.3 0 0 0-.6 2.9A3.6 3.6 0 0 0 12 21Z"
        fill={active ? "#FDE047" : "#E5E7EB"}
      />
    </svg>
  );
}

export function PlusIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function MoreIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

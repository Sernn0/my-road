import { THUMB_H, THUMB_W, type Thumbnail } from "@/lib/geo/thumbnail";

// 코스 모양 썸네일: 경로 선과 출발(초록)·도착(빨강) 점
export default function CourseThumbnail({ thumbnail, label }: { thumbnail?: Thumbnail | null; label: string }) {
  return (
    <svg
      viewBox={`0 0 ${THUMB_W} ${THUMB_H}`}
      role="img"
      aria-label={`${label} 코스 모양`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {thumbnail ? (
        <>
          <path d={thumbnail.d} fill="none" stroke="#10B981" strokeOpacity="0.25" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d={thumbnail.d} fill="none" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={thumbnail.start[0]} cy={thumbnail.start[1]} r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
          <circle cx={thumbnail.end[0]} cy={thumbnail.end[1]} r="5" fill="#DC2626" stroke="#fff" strokeWidth="2" />
        </>
      ) : (
        <text x={THUMB_W / 2} y={THUMB_H / 2} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">
          모양 없음
        </text>
      )}
    </svg>
  );
}

import { THUMB_H, THUMB_W, type Thumbnail } from "@/lib/geo/thumbnail";
import { MAP_COLORS as c } from "@/lib/map/style";

// 코스 썸네일: 아주 간략한 바탕 지도(공원·물·큰 길) 위에 코스 경로와 출발(초록)·도착(빨강) 점.
// 색은 상세 지도(lib/map/style.ts)와 같아서, 썸네일을 보고 "어디쯤 코스였지" 하고 떠올리기 쉽다.
export default function CourseThumbnail({ thumbnail, label }: { thumbnail?: Thumbnail | null; label: string }) {
  const map = thumbnail?.basemap;
  return (
    <svg
      viewBox={`0 0 ${THUMB_W} ${THUMB_H}`}
      role="img"
      aria-label={`${label} 코스 모양`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={THUMB_W} height={THUMB_H} fill={c.background} />
      {map && (
        <g aria-hidden="true">
          <path d={map.green} fill={c.park} />
          <path d={map.water} fill={c.water} />
          <path d={map.waterLines} fill="none" stroke={c.waterway} strokeWidth="1.5" strokeLinecap="round" />
          <path d={map.roads} fill="none" stroke={c.roadCasing} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d={map.roads} fill="none" stroke={c.road} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {thumbnail ? (
        <>
          <path d={thumbnail.d} fill="none" stroke={c.routeGlow} strokeOpacity="0.3" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d={thumbnail.d} fill="none" stroke={c.route} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={thumbnail.start[0]} cy={thumbnail.start[1]} r="5" fill={c.start} stroke="#fff" strokeWidth="2" />
          <circle cx={thumbnail.end[0]} cy={thumbnail.end[1]} r="5" fill={c.end} stroke="#fff" strokeWidth="2" />
        </>
      ) : (
        <text x={THUMB_W / 2} y={THUMB_H / 2} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">
          모양 없음
        </text>
      )}
    </svg>
  );
}

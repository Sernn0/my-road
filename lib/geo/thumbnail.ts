// 코스 모양 썸네일 (경로 모양 + 아주 간략한 바탕 지도). 점은 [위도, 경도] 순서이다.
// 화면에 보낼 데이터를 줄이려고, 서버에서 SVG 선 모양(path d)으로 바꿔서 보낸다.
// 바탕 지도와 경로를 같은 방식(웹 메르카토르)으로 펼쳐서, 경로가 실제 길 위에 정확히 겹치게 한다.

export const THUMB_W = 160;
export const THUMB_H = 120;
// 여백: "card"는 코스 카드용(위쪽 "시연" 표시와 ⋯ 버튼에 선이 가리지 않도록 위 여백을 크게), "photo"는 기록 이미지용(고르게)
export type ThumbLayout = "card" | "photo";
const PADS: Record<ThumbLayout, { side: number; top: number; bottom: number }> = {
  card: { side: 18, top: 42, bottom: 14 },
  photo: { side: 20, top: 20, bottom: 20 },
};
const MAX_POINTS = 80; // 점이 많으면 고르게 골라 80개까지만 쓴다

// 바탕 지도의 층별 SVG 모양 (lib/map/thumb-basemap.ts에서 만든다)
export type ThumbBasemap = {
  green: string; // 공원·숲
  water: string; // 호수·강 면
  waterLines: string; // 하천 선
  roads: string; // 큰 길
};

export type Thumbnail = {
  d: string;
  start: [number, number];
  end: [number, number];
  basemap?: ThumbBasemap | null;
};

// 경도·위도 → 웹 메르카토르 (0~1 사이 값)
export function mercator(lng: number, lat: number): [number, number] {
  const x = (lng + 180) / 360;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  return [x, y];
}

// 썸네일 틀: 메르카토르 좌표를 썸네일 좌표로 바꾸는 방법과, 썸네일 전체가 덮는 메르카토르 범위
export type ThumbFrame = { scale: number; minX: number; minY: number; offX: number; offY: number };

export function frameFor(path: [number, number][], layout: ThumbLayout = "card"): ThumbFrame | null {
  if (path.length < 2) return null;
  const { side: PAD, top: PAD_TOP, bottom: PAD_BOTTOM } = PADS[layout];
  const pts = path.map(([lat, lng]) => mercator(lng, lat));
  const minX = Math.min(...pts.map((p) => p[0]));
  const minY = Math.min(...pts.map((p) => p[1]));
  const spanX = Math.max(...pts.map((p) => p[0])) - minX || 1e-12;
  const spanY = Math.max(...pts.map((p) => p[1])) - minY || 1e-12;
  const scale = Math.min((THUMB_W - PAD * 2) / spanX, (THUMB_H - PAD_TOP - PAD_BOTTOM) / spanY);
  // 가운데 정렬 (세로는 위 여백을 더 둔 영역 안에서)
  const offX = (THUMB_W - spanX * scale) / 2;
  const offY = PAD_TOP + (THUMB_H - PAD_TOP - PAD_BOTTOM - spanY * scale) / 2;
  return { scale, minX, minY, offX, offY };
}

export function project(frame: ThumbFrame, mx: number, my: number): [number, number] {
  return [
    Math.round((frame.offX + (mx - frame.minX) * frame.scale) * 10) / 10,
    Math.round((frame.offY + (my - frame.minY) * frame.scale) * 10) / 10,
  ];
}

// 썸네일 전체(여백 포함)가 덮는 메르카토르 범위 [x0, y0, x1, y1]
export function frameBounds(frame: ThumbFrame): [number, number, number, number] {
  const x0 = frame.minX - frame.offX / frame.scale;
  const y0 = frame.minY - frame.offY / frame.scale;
  return [x0, y0, x0 + THUMB_W / frame.scale, y0 + THUMB_H / frame.scale];
}

export function courseThumbnail(path: [number, number][], layout: ThumbLayout = "card"): Thumbnail | null {
  const frame = frameFor(path, layout);
  if (!frame) return null;
  const step = Math.max(1, Math.ceil(path.length / MAX_POINTS));
  const picked = path.filter((_, i) => i % step === 0);
  if (picked[picked.length - 1] !== path[path.length - 1]) picked.push(path[path.length - 1]);
  const pts = picked.map(([lat, lng]) => {
    const [mx, my] = mercator(lng, lat);
    return project(frame, mx, my);
  });
  return {
    d: pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" "),
    start: pts[0],
    end: pts[pts.length - 1],
  };
}

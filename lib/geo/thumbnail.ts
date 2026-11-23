// 코스 모양 썸네일 (지도 없이 경로 모양만 그린 작은 그림). 점은 [위도, 경도] 순서이다.
// 화면에 보낼 데이터를 줄이려고, 서버에서 SVG 선 모양(path d)으로 바꿔서 보낸다.

export const THUMB_W = 160;
export const THUMB_H = 120;
const PAD = 18; // 좌우 여백
const PAD_TOP = 42; // 카드 위쪽의 "시연" 표시와 ⋯ 버튼에 선이 가리지 않도록 위 여백을 크게 둔다
const PAD_BOTTOM = 14;
const MAX_POINTS = 80; // 점이 많으면 고르게 골라 80개까지만 쓴다

export type Thumbnail = { d: string; start: [number, number]; end: [number, number] };

export function courseThumbnail(path: [number, number][]): Thumbnail | null {
  if (path.length < 2) return null;
  const step = Math.max(1, Math.ceil(path.length / MAX_POINTS));
  const picked = path.filter((_, i) => i % step === 0);
  if (picked[picked.length - 1] !== path[path.length - 1]) picked.push(path[path.length - 1]);

  // 위도에 따라 경도 1도의 길이가 달라서, 평균 위도로 가로를 보정한다
  const meanLat = picked.reduce((s, [lat]) => s + lat, 0) / picked.length;
  const kx = Math.cos((meanLat * Math.PI) / 180);
  const xs = picked.map(([, lng]) => lng * kx);
  const ys = picked.map(([lat]) => -lat);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX || 1e-9;
  const spanY = Math.max(...ys) - minY || 1e-9;
  const scale = Math.min((THUMB_W - PAD * 2) / spanX, (THUMB_H - PAD_TOP - PAD_BOTTOM) / spanY);
  // 가운데 정렬 (세로는 위 여백을 더 둔 영역 안에서)
  const offX = (THUMB_W - spanX * scale) / 2;
  const offY = PAD_TOP + (THUMB_H - PAD_TOP - PAD_BOTTOM - spanY * scale) / 2;
  const pts = xs.map((x, i): [number, number] => [
    Math.round((offX + (x - minX) * scale) * 10) / 10,
    Math.round((offY + (ys[i] - minY) * scale) * 10) / 10,
  ]);
  return {
    d: pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" "),
    start: pts[0],
    end: pts[pts.length - 1],
  };
}

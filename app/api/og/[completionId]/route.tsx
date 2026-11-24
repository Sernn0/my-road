import { ImageResponse } from "next/og";
import { avatarArt } from "@/components/Avatar";
import { Flame } from "@/components/icons";
import { LogoMark, LogoWordmark } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCompletion } from "@/lib/completions/queries";
import { formatDateTime, formatDistanceKm, formatDuration, formatPace } from "@/lib/format";
import { courseThumbnail, THUMB_H, THUMB_W, type Thumbnail } from "@/lib/geo/thumbnail";
import { MAP_COLORS as c } from "@/lib/map/style";
import { thumbBasemap } from "@/lib/map/thumb-basemap";
import { loadKoreanFont } from "@/lib/og/font";
import { levelInfo } from "@/lib/progress/level";
import { effectiveStreak, kstDate } from "@/lib/progress/streak";

// 완주 기록 이미지 (PLAN 21번, DESIGN.md 5번): 포토카드 모양 (1080×1680, 무지갯빛 테두리 + 흰 카드)
// 담는 것: 코스 모양(간략 지도), 코스 이름, 완주 날짜·시각, 거리·소요 시간·평균 페이스, 프로필(테스트 계정 닉네임·캐릭터·레벨·연속 달성), 경험치
// 코스 모양은 저장된 코스 경로로 그린다. 실제로 달린 GPS 궤적은 서버에 없어서 쓰지 않는다. (PRD 5번)

const W = 1080;
const H = 1680;
const LEVEL_COLORS = ["#84CC16", "#0EA5E9", "#8B5CF6", "#F59E0B", "#F43F5E"];

// 코스 썸네일을 큰 그림용 SVG 글로 만든다 (이미지 생성기에 data 주소로 넣는다)
function mapSvg(thumb: Thumbnail | null): string {
  const m = thumb?.basemap;
  const body = thumb
    ? `${m ? `<path d="${m.green}" fill="${c.park}"/><path d="${m.water}" fill="${c.water}"/>` +
        `<path d="${m.waterLines}" fill="none" stroke="${c.waterway}" stroke-width="1.2" stroke-linecap="round"/>` +
        `<path d="${m.roads}" fill="none" stroke="${c.roadCasing}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${m.roads}" fill="none" stroke="${c.road}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}` +
      `<path d="${thumb.d}" fill="none" stroke="${c.routeGlow}" stroke-opacity="0.3" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${thumb.d}" fill="none" stroke="${c.route}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="${thumb.start[0]}" cy="${thumb.start[1]}" r="4.2" fill="${c.start}" stroke="#fff" stroke-width="1.6"/>` +
      `<circle cx="${thumb.end[0]}" cy="${thumb.end[1]}" r="4.2" fill="${c.end}" stroke="#fff" stroke-width="1.6"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${THUMB_W} ${THUMB_H}" width="${THUMB_W * 6}" height="${THUMB_H * 6}"><rect width="${THUMB_W}" height="${THUMB_H}" fill="${c.background}"/>${body}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// 반짝이 장식 (네 갈래 별)
function Sparkle({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y }}>
      <path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill={color} />
    </svg>
  );
}

export async function GET(_request: Request, ctx: RouteContext<"/api/og/[completionId]">) {
  const { completionId } = await ctx.params;
  const summary = await getCompletion(completionId);
  if (!summary) {
    return Response.json({ error: { code: "NOT_FOUND", message: "완주 기록을 찾을 수 없습니다" } }, { status: 404 });
  }
  const user = await getCurrentUser();

  const thumb = summary.coursePath ? courseThumbnail(summary.coursePath, "photo") : null;
  const basemap = thumb && summary.coursePath ? await thumbBasemap(`${summary.id}:photo`, summary.coursePath, "photo") : null;
  const pace = summary.distanceKm > 0 ? summary.durationSec / summary.distanceKm : 0;
  const info = user ? levelInfo(user.totalXp) : null;
  const streak = user ? effectiveStreak(user, kstDate()) : 0;

  const distance = formatDistanceKm(summary.distanceKm);
  const when = formatDateTime(summary.completedAt);
  const stats: [string, string][] = [
    ["거리", distance],
    ["소요 시간", formatDuration(summary.durationSec)],
    ["평균 페이스", pace ? formatPace(pace) : "-"],
  ];
  const xpText = `+${summary.xp} XP`;
  const streakText = `연속 ${streak}일`;

  // 이미지에 쓰는 글자만 담은 글꼴 조각을 받아 온다 (굵기 2가지)
  const text = [
    "COMPLETE", "FINISH", "마이로드에서 완주한 기록", summary.courseName, when, distance, xpText, streakText,
    ...stats.flat(), user?.nickname ?? "", info?.title ?? "", "0123456789.:+-'\"()·",
  ].join("");
  const [bold, black] = await Promise.all([loadKoreanFont(text, 700), loadKoreanFont(text, 900)]);
  if (!bold || !black) {
    return Response.json({ error: { code: "FONT_FAILED", message: "이미지를 만들지 못했습니다" } }, { status: 502 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          padding: 44,
          position: "relative",
          background: "linear-gradient(135deg, #A7F3D0 0%, #BAE6FD 28%, #DDD6FE 55%, #FBCFE8 80%, #FDE68A 100%)",
          fontFamily: "Noto Sans KR",
          color: "#0F172A",
        }}
      >
        {/* 테두리 반짝이 */}
        <Sparkle x={10} y={10} s={30} color="#FFFFFF" />
        <Sparkle x={1030} y={60} s={22} color="#FFFFFF" />
        <Sparkle x={14} y={1600} s={24} color="#FFFFFF" />
        <Sparkle x={1028} y={1622} s={34} color="#FFFFFF" />

        {/* 흰 카드 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 48,
            borderRadius: 56,
            background: "#FFFFFF",
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.12)",
          }}
        >
          {/* 위: 로고 + 완주 표시 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {LogoMark({ size: 72, id: "card" })}
              {LogoWordmark({ height: 50 })}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 4,
                color: "#059669",
                border: "4px solid #059669",
                borderRadius: 999,
                padding: "6px 22px",
              }}
            >
              COMPLETE
            </div>
          </div>

          {/* 코스 모양 */}
          <div style={{ display: "flex", position: "relative", width: 888, height: 666, borderRadius: 40, overflow: "hidden", border: "4px solid #ECFDF5" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 서버 이미지 생성기 안의 그림이라 next/image를 쓸 수 없다 */}
            <img src={mapSvg(thumb ? { ...thumb, basemap } : null)} width={888} height={666} alt="" />
            <div
              style={{
                position: "absolute",
                left: 28,
                bottom: 28,
                display: "flex",
                fontSize: 64,
                fontWeight: 900,
                color: "#FFFFFF",
                background: "#059669",
                borderRadius: 28,
                padding: "6px 30px",
                transform: "rotate(-4deg)",
                boxShadow: "0 8px 20px rgba(5, 150, 105, 0.35)",
              }}
            >
              {distance}
            </div>
            <div
              style={{
                position: "absolute",
                right: 24,
                top: 24,
                display: "flex",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 3,
                color: "#DC2626",
                background: "rgba(255,255,255,0.92)",
                borderRadius: 999,
                padding: "8px 20px",
              }}
            >
              FINISH
            </div>
          </div>

          {/* 코스 이름과 날짜·시각 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", fontSize: summary.courseName.length > 16 ? 50 : 60, fontWeight: 900, lineHeight: 1.2 }}>{summary.courseName}</div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#64748B" }}>{when}</div>
          </div>

          {/* 기록 */}
          <div style={{ display: "flex", gap: 20 }}>
            {stats.map(([label, value]) => (
              <div
                key={label}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "24px 0", borderRadius: 32, background: "#F0FDF4" }}
              >
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#64748B" }}>{label}</div>
                <div style={{ display: "flex", fontSize: 52, fontWeight: 900 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* 절취선 */}
          <div style={{ display: "flex", borderTop: "4px dashed #D1FAE5" }} />

          {/* 프로필 + 경험치 */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {user && (
              <div style={{ display: "flex", borderRadius: 999, border: "6px solid #D1FAE5" }}>
                <svg width="112" height="112" viewBox="0 0 100 100">
                  {avatarArt(user.id, user.nickname)}
                </svg>
              </div>
            )}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 900 }}>{user?.nickname ?? "마이로드"}</div>
              {info && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 700, color: "#475569" }}>
                  <div style={{ display: "flex", position: "relative", width: 36, height: 36 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24">
                      <path d="M12 1.5 21 5v6.2c0 5.4-3.8 9.7-9 11.3-5.2-1.6-9-5.9-9-11.3V5l9-3.5Z" fill={LEVEL_COLORS[info.level - 1]} />
                    </svg>
                    <div style={{ position: "absolute", left: 0, top: 0, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#FFFFFF", paddingTop: 1 }}>
                      {info.level}
                    </div>
                  </div>
                  <div style={{ display: "flex" }}>{info.title}</div>
                  <div style={{ display: "flex", marginLeft: 10 }}>{Flame({ active: streak > 0, size: 34 })}</div>
                  <div style={{ display: "flex" }}>{streakText}</div>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 900,
                color: "#FFFFFF",
                padding: "14px 26px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #F59E0B 0%, #F472B6 100%)",
                transform: "rotate(6deg)",
                boxShadow: "0 8px 20px rgba(244, 114, 182, 0.35)",
              }}
            >
              {xpText}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Noto Sans KR", data: bold, weight: 700, style: "normal" },
        { name: "Noto Sans KR", data: black, weight: 900, style: "normal" },
      ],
    },
  );
}

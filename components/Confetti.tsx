"use client";

import { useEffect, useRef } from "react";

// 축하 폭죽: 화면 왼쪽 아래와 오른쪽 아래 모서리에서 색종이를 조금씩, 불규칙한 간격으로 쏘아 올린다.
// 화면을 누르는 데 방해되지 않게 클릭은 통과시키고, "동작 줄이기" 설정을 켠 기기에서는 쏘지 않는다.

const COLORS = ["#10B981", "#34D399", "#FBBF24", "#F472B6", "#60A5FA", "#A78BFA", "#FB7185"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  shape: "rect" | "circle";
  life: number; // 남은 수명 (초)
};

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pieces: Piece[] = [];
    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // 한쪽 모서리에서 count개를 위쪽 안쪽으로 쏜다
    const burst = (side: "left" | "right", count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = ((60 + Math.random() * 25) * Math.PI) / 180; // 수평에서 60~85도 위로
        const speed = 420 + Math.random() * 360;
        const dir = side === "left" ? 1 : -1;
        pieces.push({
          x: side === "left" ? -4 : width + 4,
          y: height + 4,
          vx: Math.cos(angle) * speed * dir * (0.35 + Math.random() * 0.4),
          vy: -Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 12,
          w: 6 + Math.random() * 5,
          h: 4 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: Math.random() < 0.3 ? "circle" : "rect",
          life: 2.6 + Math.random() * 1.2,
        });
      }
    };

    // 처음에는 양쪽에서 한 번씩, 그 뒤로는 0.7~2.2초마다 무작위 한쪽(가끔 양쪽)에서 몇 개씩
    burst("left", 14);
    burst("right", 14);
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!document.hidden) {
          const r = Math.random();
          if (r < 0.45) burst("left", 4 + Math.floor(Math.random() * 5));
          else if (r < 0.9) burst("right", 4 + Math.floor(Math.random() * 5));
          else {
            burst("left", 5);
            burst("right", 5);
          }
        }
        schedule();
      }, 700 + Math.random() * 1500);
    };
    schedule();

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      pieces = pieces.filter((p) => p.life > 0 && p.y < height + 40);
      for (const p of pieces) {
        p.vy += 680 * dt; // 중력
        p.vx *= 1 - 1.4 * dt; // 공기 저항
        p.vy *= 1 - 0.9 * dt;
        p.x += p.vx * dt + Math.sin(now / 300 + p.rot) * 0.4; // 살랑살랑
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 0.6);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 1.3)) + 1); // 뒤집히는 느낌
        }
        ctx.restore();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-1/2 z-20 h-dvh w-full max-w-md -translate-x-1/2"
    />
  );
}

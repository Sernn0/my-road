"use client";

import { useEffect, type ReactNode } from "react";

// 화면 아래에서 올라오는 창. 바깥(어두운 부분)을 누르거나 Esc를 누르면 닫힌다.
export default function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-t-3xl bg-background px-4 pb-8 pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-foreground/20" />
        <h2 className="mb-3 px-1 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  kind?: "success" | "error";
  message: string | null;
  onClose: () => void;
  duration?: number; // ms
};

export default function Toast({
  open,
  kind = "success",
  message,
  onClose,
  duration = 3500,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open || !message) return null;

  const color =
    kind === "success"
      ? "bg-green-600 text-white"
      : "bg-red-600 text-white";

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-2">
      <div className={`max-w-md w-full rounded-lg shadow-lg ${color}`}>
        <div className="flex items-start gap-3 p-3">
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-white/90" />
          <div className="text-sm">
            {message}
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded px-2 text-xs opacity-90 hover:opacity-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

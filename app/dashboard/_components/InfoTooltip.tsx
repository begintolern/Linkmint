"use client";

import { useId, useState } from "react";

type Props = {
  text: string;
  className?: string;
  align?: "left" | "right";
};

export default function InfoTooltip({ text, className, align = "left" }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const panelAlign =
    align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <span
      className={`relative inline-flex ${className ?? ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More info"
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      >
        i
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-snug text-slate-700 shadow-lg ${panelAlign}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}

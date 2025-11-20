"use client";

import { useEffect } from "react";

export default function DemoViewTracker() {
  useEffect(() => {
    fetch("/api/demo/shopee-view", {
      method: "POST",
    }).catch((err) => {
      console.error("[DemoViewTracker] failed to log view:", err);
    });
  }, []);

  return null; // invisible component
}

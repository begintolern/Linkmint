"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

type Props = {
  replay?: boolean;
  onClose?: () => void; // parent unmount handler
};

export default function OnboardingTour({ replay = false, onClose }: Props) {
  const router = useRouter();
  const [run, setRun] = useState(false);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);

  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  const steps: Step[] = useMemo(
    () => [
      { target: "#tour-create-link",  title: "Create your first Smart Link", content: "Start here: paste a product URL or pick a merchant.", disableBeacon: true, placement: "bottom" },
      { target: "#tour-merchant-rules", title: "Merchant Rules + AI Suggestions", content: "Check what’s allowed, then use AI Suggestions (beta) to find offers.", placement: "right" },
      { target: "#tour-referrals", title: "Invite 3 friends = 5% bonus", content: "Each batch of 3 invitees unlocks a 90-day 5% override.", placement: "top" },
      { target: "#tour-trust-center", title: "Trust Center", content: "Payouts only after affiliate approval—see timing & eligibility here.", placement: "top" },
      { target: "#tour-payouts", title: "Payouts", content: "When commissions are approved, request/receive payouts here.", placement: "top" },
      { target: "#tour-finish", title: "You're ready!", content: "Mint your first link and share it. Earnings will show as clicks convert.", placement: "top" },
    ],
    []
  );

  const hardCleanup = useCallback(() => {
    if (!isBrowser) return;
    try {
      [".react-joyride__overlay", ".react-joyride__tooltip", ".react-joyride__beacon", "[data-test-id='react-joyride']"]
        .forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));
      document.body.removeAttribute("aria-hidden");
    } catch {}
  }, [isBrowser]);

  // If any runtime error happens while tour is up, exit safely.
  useEffect(() => {
    if (!isBrowser) return;
    const onAnyError = () => {
      setRun(false);
      setEnded(true);
      hardCleanup();
      onClose?.();
      try { router.replace("/dashboard"); } catch {}
      try { window.location.replace("/dashboard"); } catch {}
    };
    window.addEventListener("error", onAnyError);
    window.addEventListener("unhandledrejection", onAnyError);
    return () => {
      window.removeEventListener("error", onAnyError);
      window.removeEventListener("unhandledrejection", onAnyError);
    };
  }, [isBrowser, hardCleanup, onClose, router]);

  // Initialize run state
  useEffect(() => {
    if (!isBrowser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/walkthrough/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status error");
        const data = await res.json();
        if (cancelled) return;
        const hasCompleted = !!data?.hasCompletedWalkthrough;
        setRun(replay ? true : !hasCompleted);
        setReady(true);
      } catch {
        setRun(!!replay);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      hardCleanup();
    };
  }, [replay, isBrowser, hardCleanup]);

  // End on any exit signal
  const endTour = useCallback(() => {
    setRun(false);
    setEnded(true);
    hardCleanup();
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch {}
    try { onClose?.(); } catch {}
    try { router.replace("/dashboard"); } catch {}
    setTimeout(() => { try { window.location.replace("/dashboard"); } catch {} }, 25);
  }, [hardCleanup, onClose, router]);

  const handleJoyride = useCallback(async (data: CallBackProps) => {
    // If Joyride reports a missing target, just end gracefully (prevents crashes).
    if ((data as any)?.type === "error" || (data as any)?.action === "error") {
      return endTour();
    }
    const endedNow =
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED ||
      (data as any)?.action === "skip" ||
      (data as any)?.action === "close" ||
      (data as any)?.type === "tour:end";
    if (endedNow) {
      try { await fetch("/api/user/walkthrough/complete", { method: "POST" }); } catch {}
      return endTour();
    }
  }, [endTour]);

  if (!isBrowser || !ready || ended) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      disableOverlayClose
      // Prevent auto-scrolling issues and spotlighting crashes on missing targets
      disableScrolling
      spotlightClicks
      styles={{ options: { zIndex: 9999 } }}
      locale={{ back: "Back", close: "Close", last: "Finish", next: "Next", skip: "Skip tour" }}
      callback={handleJoyride}
    />
  );
}

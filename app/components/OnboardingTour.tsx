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
  const [ended, setEnded] = useState(false); // hard stop rendering after exit

  const steps: Step[] = useMemo(
    () => [
      {
        target: "#tour-create-link",
        title: "Create your first Smart Link",
        content: "Start here: paste a product URL or pick a merchant.",
        disableBeacon: true,
        placement: "bottom",
      },
      {
        target: "#tour-merchant-rules",
        title: "Merchant Rules + AI Suggestions",
        content: "Check what’s allowed, then use AI Suggestions (beta) to find offers.",
        placement: "right",
      },
      {
        target: "#tour-referrals",
        title: "Invite 3 friends = 5% bonus",
        content: "Each batch of 3 invitees unlocks a 90-day 5% override.",
        placement: "top",
      },
      {
        target: "#tour-trust-center",
        title: "Trust Center",
        content: "Payouts only after affiliate approval—see timing & eligibility here.",
        placement: "top",
      },
      {
        target: "#tour-payouts",
        title: "Payouts",
        content: "When commissions are approved, request/receive payouts here.",
        placement: "top",
      },
      {
        target: "#tour-finish",
        title: "You're ready!",
        content: "Mint your first link and share it. Earnings will show as clicks convert.",
        placement: "top",
      },
    ],
    []
  );

  // Remove any Joyride DOM artifacts (belt-and-suspenders)
  const hardCleanup = useCallback(() => {
    try {
      const selectors = [
        ".react-joyride__overlay",
        ".react-joyride__tooltip",
        ".react-joyride__beacon",
        "[data-test-id='react-joyride']",
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      });
      document.body.removeAttribute("aria-hidden");
    } catch {}
  }, []);

  useEffect(() => {
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
      hardCleanup();
    };
  }, [replay, hardCleanup]);

  // End the tour on ANY exit signal, unmount, and force return to dashboard
  const handleJoyride = useCallback(
    async (data: CallBackProps) => {
      const endedNow =
        data.status === STATUS.FINISHED ||
        data.status === STATUS.SKIPPED ||
        (data as any)?.action === "skip" ||
        (data as any)?.action === "close" ||
        (data as any)?.type === "tour:end";

      if (endedNow) {
        try {
          await fetch("/api/user/walkthrough/complete", { method: "POST" });
        } catch {}

        // Stop Joyride & mark ended so this component renders nothing
        setRun(false);
        setEnded(true);

        // Cleanup overlay and make cards visible
        hardCleanup();
        try { window.scrollTo({ top: 0, behavior: "auto" }); } catch {}

        // Tell parent to hide its tour state
        try { onClose?.(); } catch {}

        // Force navigation back to dashboard as a last resort
        try { router.replace("/dashboard"); } catch {}
        // Absolute fallback: hard reload to /dashboard
        setTimeout(() => {
          try { window.location.replace("/dashboard"); } catch {}
        }, 50);
      }
    },
    [onClose, hardCleanup, router]
  );

  // After end, render nothing (prevents any lingering overlay)
  if (!ready || ended) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      disableOverlayClose
      styles={{ options: { zIndex: 9999 } }}
      locale={{ back: "Back", close: "Close", last: "Finish", next: "Next", skip: "Skip tour" }}
      callback={handleJoyride}
    />
  );
}

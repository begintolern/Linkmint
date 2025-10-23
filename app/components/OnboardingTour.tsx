"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

type Props = {
  replay?: boolean;
  onClose?: () => void; // parent unmount handler
};

export default function OnboardingTour({ replay = false, onClose }: Props) {
  const [run, setRun] = useState(false);
  const [ready, setReady] = useState(false);

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

  // Helper: nuke any Joyride artifacts from the DOM
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
      // also remove aria-hidden from body if set
      document.body.removeAttribute("aria-hidden");
    } catch {}
  }, []);

  // Load walkthrough status (run on first-login unless already completed; always run if replay)
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
      // hard DOM cleanup on unmount
      hardCleanup();
    };
  }, [replay, hardCleanup]);

  // Finish/skip/close -> mark complete, stop run, force cleanup, unmount
  const handleJoyride = useCallback(
    async (data: CallBackProps) => {
      const ended =
        data.status === STATUS.FINISHED ||
        data.status === STATUS.SKIPPED ||
        (data as any)?.action === "skip" ||
        (data as any)?.action === "close" ||
        (data as any)?.type === "tour:end";

      if (ended) {
        try {
          await fetch("/api/user/walkthrough/complete", { method: "POST" });
        } catch {}
        setRun(false);

        // ensure overview is visible
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {}

        // nuke any leftover Joyride elements, then unmount parent
        hardCleanup();
        setTimeout(() => onClose?.(), 10);
      }
    },
    [onClose, hardCleanup]
  );

  if (!ready) return null;

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

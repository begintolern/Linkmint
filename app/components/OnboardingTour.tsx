"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

type Props = { replay?: boolean };

export default function OnboardingTour({ replay = false }: Props) {
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

  // Load walkthrough status
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
        // If status fails (or column missing), allow replay only
        setRun(!!replay);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [replay]);

  // Mark complete when tour ends or is skipped
  const handleJoyride = useCallback(async (data: CallBackProps) => {
    const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(data.status);
    if (finished) {
      try {
        await fetch("/api/user/walkthrough/complete", { method: "POST" });
      } catch {
        // no-op
      }
      setRun(false);
    }
  }, []);

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

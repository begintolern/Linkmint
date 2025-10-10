// app/_diag/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function DiagPage() {
  const [docCookie, setDocCookie] = useState<string>("(reading…)");

  useEffect(() => {
    try { setDocCookie(document.cookie || "(empty)"); } catch { setDocCookie("(error)"); }
  }, []);

  return (
    <main style={{maxWidth: 700, margin: "40px auto", padding: 16, fontFamily: "system-ui"}}>
      <h1>Cookie Debug</h1>
      <p><strong>document.cookie</strong></p>
      <pre style={{whiteSpace:"pre-wrap"}}>{docCookie}</pre>
      <p>Server view:</p>
      <a href="/api/_diag/session" style={{color:"#0a7"}}>/api/_diag/session</a>
    </main>
  );
}

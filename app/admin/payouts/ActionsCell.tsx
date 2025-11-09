"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  id: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | string;
};

export default function ActionsCell({ id, status }: Props) {
  const router = useRouter();
  const qs = useSearchParams();
  const currentStatus = qs ? qs.get("status") || "ALL" : "ALL";

  async function post(path: string, body: any) {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": (window as any).__ADMIN_KEY || "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data;
  }

  async function handleProcess() {
    try {
      await post("/api/admin/payout-requests/mark-processing", { id });
      toast("Request marked PROCESSING");
      router.refresh();
    } catch (e: any) {
      toast("Failed to mark processing: " + (e?.message || "Error"));
    }
  }

  async function handlePaid() {
    try {
      await post("/api/admin/payout-requests/mark-paid", { id });
      toast("Request marked PAID");
      router.refresh();
    } catch (e: any) {
      toast("Failed to mark paid: " + (e?.message || "Error"));
    }
  }

  async function handleDeny() {
    const note = prompt("Add a short note (optional):", "Denied by admin");
    try {
      await post("/api/admin/payout-requests/deny", { id, note });
      toast("Request denied");
      router.refresh();
    } catch (e: any) {
      toast("Failed to deny: " + (e?.message || "Error"));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "PENDING" && (
        <>
          <button
            onClick={handleProcess}
            className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
          >
            Mark Processing
          </button>
          <button
            onClick={handlePaid}
            className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
          >
            Mark Paid
          </button>
          <button
            onClick={handleDeny}
            className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
          >
            Deny
          </button>
        </>
      )}

      {status === "PROCESSING" && (
        <button
          onClick={handlePaid}
          className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
        >
          Complete Paid
        </button>
      )}

      {status === "PAID" && (
        <a
          href={`/admin/payouts/ledger/${id}`}
          className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
        >
          Details
        </a>
      )}

      {status !== "PENDING" &&
        status !== "PROCESSING" &&
        status !== "PAID" && (
          <span className="text-xs text-gray-500">—</span>
        )}

      <span className="hidden text-[10px] text-gray-400">
        tab:{currentStatus}
      </span>
    </div>
  );
}

// simple alert fallback toast
function toast(msg: string) {
  try {
    alert(msg);
  } catch {
    console.log(msg);
  }
}

// lib/engines/recordCommission.wrap.ts
import { recordCommission as originalRecordCommission } from "./recordCommission";

// Derive types from the original function so signatures stay in sync
export type RecordCommissionArgs = Parameters<typeof originalRecordCommission>[0];
export type RecordCommissionResult = ReturnType<typeof originalRecordCommission>;

/** Thin wrapper that forwards to the original engine. */
export async function recordCommission(
  args: RecordCommissionArgs
): Promise<RecordCommissionResult> {
  return originalRecordCommission(args);
}

// Optional: provide a default export for callers that expect one
export default recordCommission;

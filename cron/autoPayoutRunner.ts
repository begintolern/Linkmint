// cron/autoPayoutRunner.ts
import { runAutoPayoutEngine } from "@/lib/payouts/autoPayoutEngine";

export async function run() {
  console.log("⏰ Auto payout cron triggered...");
  await runAutoPayoutEngine();
  console.log("✅ Auto payout cron finished.");
}

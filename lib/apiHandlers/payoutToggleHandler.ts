// lib/apiHandlers/payoutToggleHandler.ts

import { prisma } from "../db";

// This toggles a single system setting in the database — enable/disable auto payouts
export async function handleAutoPayoutToggle(): Promise<{ success: boolean; message: string }> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "autoPayoutEnabled" },
    });

    if (!setting) {
      await prisma.systemSetting.create({
        data: { key: "autoPayoutEnabled", value: "true" },
      });
      return { success: true, message: "Auto payout setting created and enabled." };
    }

    const newValue = setting.value === "true" ? "false" : "true";

    await prisma.systemSetting.update({
      where: { key: "autoPayoutEnabled" },
      data: { value: newValue },
    });

    return {
      success: true,
      message: `Auto payout toggled to ${newValue}.`,
    };
  } catch (error) {
    console.error("Toggle error (DB or Prisma):", error);
    return {
      success: false,
      message: "Toggle failed due to internal error.",
    };
  }
}

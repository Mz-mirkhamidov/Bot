"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";

export function hapticImpact(style: "light" | "medium" | "heavy" = "light") {
  try {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred(style);
    }
  } catch {
    // Telegramdan tashqarida — e'tiborsiz qoldiramiz.
  }
}

export function hapticNotify(type: "success" | "error" | "warning") {
  try {
    if (hapticFeedback.notificationOccurred.isAvailable()) {
      hapticFeedback.notificationOccurred(type);
    }
  } catch {
    // Telegramdan tashqarida — e'tiborsiz qoldiramiz.
  }
}

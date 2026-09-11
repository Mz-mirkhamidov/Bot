"use client";

import { useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";

export function useTelegramBackButton(onBack: (() => void) | null) {
  useEffect(() => {
    if (!onBack) return;
    try {
      if (!backButton.isSupported()) return;
      if (backButton.mount.isAvailable()) backButton.mount();
      backButton.show();
      const off = backButton.onClick(onBack);
      return () => {
        off();
        backButton.hide();
      };
    } catch {
      // Telegramdan tashqarida — e'tiborsiz qoldiramiz.
    }
  }, [onBack]);
}

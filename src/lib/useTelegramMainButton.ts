"use client";

import { useEffect } from "react";
import { mainButton } from "@telegram-apps/sdk-react";

type Options = {
  text: string;
  visible: boolean;
  enabled?: boolean;
  onClick: () => void;
};

export function useTelegramMainButton({ text, visible, enabled = true, onClick }: Options) {
  useEffect(() => {
    try {
      if (mainButton.mount.isAvailable() && !mainButton.isMounted()) {
        mainButton.mount();
      }
      if (mainButton.setParams.isAvailable()) {
        mainButton.setParams({
          text,
          isVisible: visible,
          isEnabled: enabled,
        });
      }
      const off = mainButton.onClick.isAvailable() ? mainButton.onClick(onClick) : undefined;
      return () => {
        off?.();
      };
    } catch {
      // Telegramdan tashqarida — e'tiborsiz qoldiramiz.
    }
  }, [text, visible, enabled, onClick]);

  useEffect(() => {
    return () => {
      try {
        if (mainButton.setParams.isAvailable()) {
          mainButton.setParams({ isVisible: false });
        }
      } catch {
        // no-op
      }
    };
  }, []);
}

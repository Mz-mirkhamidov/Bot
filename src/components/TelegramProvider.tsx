"use client";

import { useEffect } from "react";
import { init, themeParams, miniApp } from "@telegram-apps/sdk-react";

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      init();
      if (themeParams.mountSync.isAvailable()) themeParams.mountSync();
      if (themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();
      if (miniApp.mountSync.isAvailable()) miniApp.mountSync();
      if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();
      if (miniApp.ready.isAvailable()) miniApp.ready();
    } catch {
      // Telegramdan tashqarida (brauzerda) ochilgan — SDK ishlamaydi, davom etamiz.
    }
  }, []);

  return <>{children}</>;
}

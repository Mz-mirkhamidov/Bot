"use client";

import { useEffect, useState } from "react";
import { retrieveRawInitData } from "@telegram-apps/sdk-react";

// Telegramdan tashqarida (oddiy brauzerda) ochilganda retrieveRawInitData xato
// tashlaydi — buni faqat clientda, effekt ichida xavfsiz o'qiymiz.
// `ready` — initData olishga urinib ko'rilganini bildiradi (Telegramdan tashqarida
// bo'lsa ham `raw` undefined holida "ready" bo'ladi) — shu orqali so'rovlar faqat
// bitta marta, to'g'ri qiymat bilan yuboriladi (bekorga "ruxsat yo'q" ko'rinib
// ketmasligi uchun).
export function useSafeRawInitData(): { raw: string | undefined; ready: boolean } {
  const [state, setState] = useState<{ raw: string | undefined; ready: boolean }>({
    raw: undefined,
    ready: false,
  });
  useEffect(() => {
    try {
      setState({ raw: retrieveRawInitData(), ready: true });
    } catch {
      setState({ raw: undefined, ready: true });
    }
  }, []);
  return state;
}

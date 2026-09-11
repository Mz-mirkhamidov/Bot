"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(text);
    timerRef.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { message, show };
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: message ? 24 : 8,
        transform: "translateX(-50%)",
        opacity: message ? 1 : 0,
        transition: "opacity 200ms ease, bottom 200ms ease",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {message && (
        <div
          style={{
            background: "var(--text)",
            color: "var(--bg)",
            padding: "10px 16px",
            borderRadius: "var(--radius)",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

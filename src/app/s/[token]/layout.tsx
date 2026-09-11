import { TelegramProvider } from "@/components/TelegramProvider";

export default function RespondentLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100dvh",
          padding: "16px",
        }}
      >
        {children}
      </div>
    </TelegramProvider>
  );
}

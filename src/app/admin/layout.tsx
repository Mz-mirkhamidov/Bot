import { TelegramProvider } from "@/components/TelegramProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <div
        style={{
          maxWidth: 640,
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

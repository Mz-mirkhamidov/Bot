import { IntroScreen } from "@/components/screens/IntroScreen";

export default async function SessionEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <IntroScreen token={token} />;
}

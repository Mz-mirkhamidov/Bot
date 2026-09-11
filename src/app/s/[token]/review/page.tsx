import { ReviewScreen } from "@/components/screens/ReviewScreen";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ReviewScreen token={token} />;
}

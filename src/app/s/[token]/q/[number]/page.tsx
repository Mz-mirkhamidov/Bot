import { notFound } from "next/navigation";
import { QuestionScreen } from "@/components/screens/QuestionScreen";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ token: string; number: string }>;
}) {
  const { token, number } = await params;
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 45) {
    notFound();
  }
  return <QuestionScreen key={parsed} token={token} number={parsed} />;
}

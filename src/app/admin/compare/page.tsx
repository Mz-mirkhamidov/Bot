import { CompareScreen } from "@/components/screens/CompareScreen";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  return <CompareScreen ids={ids ?? ""} />;
}

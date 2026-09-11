import { AdminSessionDetailScreen } from "@/components/screens/AdminSessionDetailScreen";

export default async function AdminSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminSessionDetailScreen id={id} />;
}

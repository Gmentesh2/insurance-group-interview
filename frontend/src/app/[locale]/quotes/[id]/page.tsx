import { QuoteResults } from "@/components/quote-results";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuoteResults sessionId={id} />;
}

import { CheckoutStart } from "@/components/checkout";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string; sessionId?: string }>;
}) {
  const params = await searchParams;
  return (
    <CheckoutStart
      quoteId={params.quoteId ?? ""}
      sessionId={params.sessionId ?? ""}
    />
  );
}

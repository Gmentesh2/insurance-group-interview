import { PolicyPage } from "@/components/account";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PolicyPage id={id} />;
}

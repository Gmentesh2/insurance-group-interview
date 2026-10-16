import { DemoLab } from "@/components/demo-lab";
export default async function Page({ searchParams }: { searchParams: Promise<{ scenario?: string }> }) {
  const { scenario } = await searchParams;
  return <DemoLab initialScenario={scenario} />;
}

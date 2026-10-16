import { homepageExample } from '@/features/homepage/preview-model';
import { Landing } from "@/components/landing";
export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
  // Keep request-time rendering; the client reads the current URL after history navigation.
  await searchParams;
  return <Landing example={homepageExample()} />;
}

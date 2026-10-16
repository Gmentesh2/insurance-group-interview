"use client";
import { PageFeedback } from "@/components/page-feedback";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <PageFeedback kind="error" onRetry={reset} />;
}

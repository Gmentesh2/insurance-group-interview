"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

const flowSteps = {
  quote: ["trip", "compare"],
  productPreview: ["productDetails", "review"],
  signIn: ["email", "code"],
  purchase: ["checkout", "travelers", "payment", "policy"],
  claim: ["details", "evidence", "review", "submitted"],
} as const;

type Flow = keyof typeof flowSteps;

/** Shared presentation only: each feature owns its real completion and navigation rules. */
export function FlowProgress({ flow, current, complete = false, onStep, canGoToStep }: {
  flow: Flow;
  current: number;
  complete?: boolean;
  onStep?: (index: number) => void;
  canGoToStep?: (index: number) => boolean;
}) {
  const t = useTranslations("flow");
  const steps = flowSteps[flow];
  const active = Math.max(0, Math.min(current, steps.length - 1));
  const completed = complete ? steps.length : active;
  return <nav className="flow-progress" aria-label={t(flow)}>
    <div className="flow-progress-meta"><span>{t(flow)}</span><strong>{complete ? t("complete") : t("stepOf", { current: active + 1, total: steps.length })}</strong></div>
    <progress className="flow-progress-bar" aria-label={t(flow)} value={completed} max={steps.length} />
    <ol className="flow-progress-steps" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, index) => {
        const done = index < completed;
        const content = <><span className="flow-step-index" aria-hidden="true">{done ? <Check size={14} /> : index + 1}</span><span>{t(step)}</span></>;
        return <li key={step} className={done ? "is-done" : index === active ? "is-current" : undefined}>
          {onStep ? <button type="button" disabled={!canGoToStep?.(index)} aria-current={!complete && index === active ? "step" : undefined} onClick={() => onStep(index)}>{content}</button> : <span className="flow-step-label" aria-current={!complete && index === active ? "step" : undefined}>{content}</span>}
        </li>;
      })}
    </ol>
  </nav>;
}

export function FieldRequirement({ optional = false }: { optional?: boolean }) {
  const t = useTranslations("flow");
  return <small className="field-requirement" aria-hidden="true">{t(optional ? "optional" : "required")}</small>;
}

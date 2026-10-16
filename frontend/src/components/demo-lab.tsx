"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, FlaskConical, ShieldCheck } from "lucide-react";
import type { DemoScenario } from "@/lib/contracts";
import { QuoteForm } from "./quote-form";
import { PageIntro } from "./ui";

const groups = [
  { key: "offers", scenarios: ["success", "single_offer", "many_offers", "no_offers"] },
  { key: "purchase", scenarios: ["quote_expired", "price_changed", "declined"] },
  { key: "after", scenarios: ["issuance_pending", "bind_unknown", "document_delayed"] },
] as const;

export function DemoLab({ initialScenario = "success" }: { initialScenario?: string }) {
  const t = useTranslations("quote");
  const d = useTranslations("demoDesign");
  const [scenario, setScenario] = useState<DemoScenario>(
    groups.flatMap(group => [...group.scenarios]).some(value => value === initialScenario) ? initialScenario as DemoScenario : "success",
  );
  function choose(value: DemoScenario) {
    setScenario(value);
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", value);
    window.history.replaceState(null, "", url);
  }
  return (
    <div className="container page-space demo-studio">
      <PageIntro eyebrow={d("label")} title={d("title")} description={d("intro")} />
      <div className="demo-studio-layout">
        <section className="demo-scenarios" aria-labelledby="scenario-heading">
          <p className="eyebrow">{d("step")}</p>
          <h2 id="scenario-heading">{d("choose")}</h2>
          {groups.map(group => <fieldset key={group.key} className="demo-scenario-group">
            <legend>{d(group.key)}</legend>
            <div>{group.scenarios.map(value => <label key={value} className="demo-scenario-option">
              <input type="radio" name="scenario" value={value} checked={scenario === value} onChange={() => choose(value)} />
              <span>{t(value)}</span><Check size={17} aria-hidden="true" />
            </label>)}</div>
          </fieldset>)}
          <div className="demo-studio-safety"><ShieldCheck size={20} aria-hidden="true" /><p>{d("safety")}</p></div>
        </section>
        <div className="demo-trip-column">
          <section className="demo-expectation" aria-live="polite" aria-atomic="true">
            <span className="demo-expectation-icon"><FlaskConical size={22} aria-hidden="true" /></span>
            <div><p className="eyebrow">{d("expected")}</p><h2>{t(scenario)}</h2><p>{d(scenario)}</p></div>
          </section>
          <p className="eyebrow demo-trip-label">{d("trip")}</p>
          <QuoteForm scenario={scenario} />
        </div>
      </div>
    </div>
  );
}

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { Analysis, Direction } from "@/lib/reading";

const VERDICT_LABEL: Record<Analysis["verdict"], string> = {
  operar: "Operar",
  esperar: "Esperar",
  no_operar: "No operar",
};

const DIRECTION_LABEL: Record<Direction, string> = {
  largo: "Largo",
  corto: "Corto",
  neutral: "Sin lado",
};

const ENTRY_LABEL: Record<Analysis["plan"]["entryType"], string> = {
  limit: "Limitada",
  market: "A mercado",
  stop: "Stop de entrada",
  none: "Sin orden",
};

const BIAS_LABEL: Record<Analysis["h4"]["bias"], string> = {
  alcista: "Alcista",
  bajista: "Bajista",
  rango: "En rango",
  incierto: "Sesgo incierto",
};

function parsePrice(value: string): number | null {
  if (!value || /ilegible|no se lee|sin eje|n\/a/i.test(value)) return null;
  const match = value.match(/-?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  let token = match[0];
  if (token.includes(".") && token.includes(",")) {
    if (token.lastIndexOf(",") > token.lastIndexOf(".")) {
      token = token.replace(/\./g, "").replace(",", ".");
    } else {
      token = token.replace(/,/g, "");
    }
  } else if (token.includes(",") && !token.includes(".")) {
    const parts = token.split(",");
    token = parts[1]?.length === 3 ? token.replace(",", "") : token.replace(",", ".");
  }
  const number = Number(token);
  return Number.isFinite(number) ? number : null;
}

type Level = {
  key: string;
  role: string;
  price: string;
  detail: string;
  kind: "target" | "entry" | "stop";
};

function levels(analysis: Analysis): Level[] {
  const { plan, direction } = analysis;
  const rows: Level[] = plan.targets.map((target, index) => ({
    key: `tp-${index}`,
    role: target.label || `TP${index + 1}`,
    price: target.price,
    detail: [target.rationale, target.partial].filter(Boolean).join(" · "),
    kind: "target",
  }));
  if (plan.entry) {
    rows.push({
      key: "entry",
      role: "Entrada",
      price: plan.entry,
      detail: plan.entryRationale,
      kind: "entry",
    });
  }
  if (plan.stop) {
    rows.push({
      key: "stop",
      role: "Stop",
      price: plan.stop,
      detail: plan.stopRationale,
      kind: "stop",
    });
  }

  const numbers = rows.map((row) => parsePrice(row.price));
  if (rows.length > 1 && numbers.every((value) => value != null)) {
    return rows
      .map((row, index) => ({ row, value: numbers[index] as number }))
      .sort((a, b) => b.value - a.value)
      .map((item) => item.row);
  }

  if (direction === "corto") {
    const stop = rows.find((row) => row.kind === "stop");
    const entry = rows.find((row) => row.kind === "entry");
    const targets = rows.filter((row) => row.kind === "target");
    return [stop, entry, ...targets].filter((row): row is Level => Boolean(row));
  }

  const targets = rows.filter((row) => row.kind === "target").reverse();
  const entry = rows.find((row) => row.kind === "entry");
  const stop = rows.find((row) => row.kind === "stop");
  return [...targets, entry, stop].filter((row): row is Level => Boolean(row));
}

function ticketText(analysis: Analysis): string {
  const targets = analysis.plan.targets
    .map((target) => `${target.label}: ${target.price} — ${target.rationale} ${target.partial}`.trim())
    .join("\n");
  return [
    `NORTE · ${analysis.instrument || "sin símbolo"}`,
    `${VERDICT_LABEL[analysis.verdict]} · ${DIRECTION_LABEL[analysis.direction]} · ${analysis.strategyName}`,
    analysis.headline,
    `4H (${BIAS_LABEL[analysis.h4.bias]}): ${analysis.h4.narrative}`,
    `15m: ${analysis.m15.trigger}`,
    `Entrada ${ENTRY_LABEL[analysis.plan.entryType]}: ${analysis.plan.entry}`,
    `Stop: ${analysis.plan.stop}`,
    targets,
    analysis.plan.riskReward ? `R:R ${analysis.plan.riskReward}` : "",
    analysis.plan.invalidation ? `Invalidación: ${analysis.plan.invalidation}` : "",
    analysis.plan.management ? `Gestión: ${analysis.plan.management}` : "",
    "Lectura educativa. No es una orden para el broker.",
  ]
    .filter(Boolean)
    .join("\n");
}

function dotClass(kind: Level["kind"]): string {
  if (kind === "entry") return "bg-brass";
  if (kind === "stop") return "bg-clay";
  return "bg-sage";
}

export function Ticket({
  analysis,
  saved,
}: {
  analysis: Analysis;
  saved?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const rows = levels(analysis);
  const operable = analysis.verdict === "operar";

  async function copy() {
    try {
      await navigator.clipboard.writeText(ticketText(analysis));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="ticket-shadow rounded-2xl bg-ticket text-ink">
      <header className="flex flex-col gap-4 border-b border-ink/10 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-widest text-ink/50 uppercase">
            {analysis.instrument || "Ticket"} · {VERDICT_LABEL[analysis.verdict]}
          </p>
          <h2 className="font-editorial mt-1 text-3xl leading-tight sm:text-4xl">{analysis.headline}</h2>
          <p className="mt-3 text-sm text-ink/70">{analysis.whyThisOne}</p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <span
            className={
              "inline-flex h-8 items-center rounded-full px-3 text-sm " +
              (analysis.direction === "largo"
                ? "bg-sage text-ticket"
                : analysis.direction === "corto"
                  ? "bg-clay text-ticket"
                  : "bg-ink/10 text-ink")
            }
          >
            {DIRECTION_LABEL[analysis.direction]}
          </span>
          <p className="text-right">
            <span className="font-editorial block text-3xl leading-none tabular-nums">{analysis.confidence}</span>
            <span className="text-xs text-ink/50">confluencia</span>
          </p>
        </div>
      </header>

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xs tracking-widest text-ink/50 uppercase">Plan</h3>
            <p className="text-sm text-ink/60">{ENTRY_LABEL[analysis.plan.entryType]}</p>
          </div>
          {rows.length > 0 ? (
            <ol className="mt-4 space-y-4">
              {rows.map((row) => (
                <li key={row.key} className="flex gap-3">
                  <span className={"mt-1.5 size-2.5 shrink-0 rounded-full " + dotClass(row.kind)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs tracking-widest text-ink/50 uppercase">{row.role}</span>
                      <span className="text-right text-sm font-medium tabular-nums">{row.price}</span>
                    </div>
                    {row.detail ? <p className="mt-1 text-sm text-ink/70">{row.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-ink/70">Sin niveles. La captura no alcanza para marcar precios.</p>
          )}
          {analysis.plan.riskReward ? (
            <p className="mt-4 text-sm text-ink/80">
              Relación aproximada <span className="tabular-nums font-medium">{analysis.plan.riskReward}</span>
            </p>
          ) : null}
          {!analysis.chartQuality.axisReadable ? (
            <p className="mt-3 text-sm text-clay">
              El eje no se lee con seguridad. Los niveles son zonas, no cotizaciones para copiar al broker.
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-xs tracking-widest text-ink/50 uppercase">4 horas · {BIAS_LABEL[analysis.h4.bias]}</h3>
            <p className="mt-2 text-sm text-ink/80">{analysis.h4.narrative || analysis.h4.structure}</p>
          </div>
          <div>
            <h3 className="text-xs tracking-widest text-ink/50 uppercase">15 minutos</h3>
            <p className="mt-2 text-sm text-ink/80">{analysis.m15.trigger}</p>
            {analysis.m15.confirmation ? (
              <p className="mt-1 text-sm text-ink/60">{analysis.m15.confirmation}</p>
            ) : null}
          </div>
          <p className="text-sm font-medium text-ink">
            {analysis.strategyName}
            {operable ? "" : " · no es una orden todavía"}
          </p>
        </section>
      </div>

      {(analysis.plan.invalidation || analysis.plan.management) && (
        <div className="grid gap-4 border-t border-ink/10 px-5 py-5 sm:grid-cols-2">
          {analysis.plan.invalidation ? (
            <div>
              <h3 className="text-xs tracking-widest text-ink/50 uppercase">Se invalida si</h3>
              <p className="mt-2 text-sm text-ink/80">{analysis.plan.invalidation}</p>
            </div>
          ) : null}
          {analysis.plan.management ? (
            <div>
              <h3 className="text-xs tracking-widest text-ink/50 uppercase">Gestión</h3>
              <p className="mt-2 text-sm text-ink/80">{analysis.plan.management}</p>
            </div>
          ) : null}
        </div>
      )}

      {analysis.checklist.length > 0 ? (
        <ul className="space-y-2 border-t border-ink/10 px-5 py-5">
          {analysis.checklist.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink/80">
              <Check className="mt-0.5 size-4 shrink-0 text-sage" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {analysis.ranked.length > 0 ? (
        <div className="border-t border-ink/10 px-5 py-5">
          <h3 className="text-xs tracking-widest text-ink/50 uppercase">También se miró</h3>
          <ul className="mt-3 space-y-3">
            {analysis.ranked.map((item) => (
              <li key={item.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <span className="tabular-nums text-ink/50">{item.score}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-ink/10">
                  <div className="h-1 rounded-full bg-brass" style={{ width: `${item.score}%` }} />
                </div>
                {item.note ? <p className="mt-1 text-xs text-ink/55">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.risks.length > 0 ? (
        <ul className="space-y-2 border-t border-ink/10 px-5 py-5">
          {analysis.risks.map((risk) => (
            <li key={risk} className="border-l-2 border-clay pl-3 text-sm text-ink/75">
              {risk}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="flex flex-col gap-3 border-t border-ink/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs text-ink/50">
          {saved
            ? "Ticket guardado en este navegador. Las capturas no se almacenan."
            : analysis.chartQuality.notes || "Lectura de estas dos capturas, no una promesa de resultado."}
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 text-sm text-ink"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar ticket"}
        </button>
      </footer>
    </article>
  );
}

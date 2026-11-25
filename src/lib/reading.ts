export type Verdict = "operar" | "esperar" | "no_operar";
export type Direction = "largo" | "corto" | "neutral";
export type Bias = "alcista" | "bajista" | "rango" | "incierto";
export type EntryType = "limit" | "market" | "stop" | "none";

export type Target = {
  label: string;
  price: string;
  rationale: string;
  partial: string;
};

export type Ranked = {
  name: string;
  score: number;
  note: string;
};

export type Analysis = {
  headline: string;
  verdict: Verdict;
  direction: Direction;
  confidence: number;
  instrument: string;
  strategyId: string;
  strategyName: string;
  whyThisOne: string;
  h4: {
    bias: Bias;
    structure: string;
    narrative: string;
  };
  m15: {
    trigger: string;
    location: string;
    confirmation: string;
  };
  plan: {
    entryType: EntryType;
    entry: string;
    entryRationale: string;
    stop: string;
    stopRationale: string;
    targets: Target[];
    riskReward: string;
    invalidation: string;
    management: string;
  };
  checklist: string[];
  ranked: Ranked[];
  risks: string[];
  chartQuality: {
    h4Ok: boolean;
    m15Ok: boolean;
    axisReadable: boolean;
    notes: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value != null && value !== "") return value;
  }
  return undefined;
}

function text(value: unknown, max = 500): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function asVerdict(value: unknown): Verdict {
  const raw = text(value, 40).toLowerCase();
  if (raw.includes("no")) return "no_operar";
  if (raw.includes("esper") || raw.includes("wait")) return "esperar";
  if (raw.includes("oper") || raw === "trade") return "operar";
  return "esperar";
}

function asDirection(value: unknown): Direction {
  const raw = text(value, 40).toLowerCase();
  if (raw.includes("larg") || raw.includes("alc") || raw.includes("buy") || raw.includes("long")) {
    return "largo";
  }
  if (raw.includes("cort") || raw.includes("baj") || raw.includes("sell") || raw.includes("short")) {
    return "corto";
  }
  return "neutral";
}

function asBias(value: unknown): Bias {
  const raw = text(value, 40).toLowerCase();
  if (raw.includes("alc") || raw.includes("bull")) return "alcista";
  if (raw.includes("baj") || raw.includes("bear")) return "bajista";
  if (raw.includes("rang")) return "rango";
  return "incierto";
}

function asEntry(value: unknown): EntryType {
  const raw = text(value, 40).toLowerCase();
  if (raw.includes("merc") || raw.includes("market")) return "market";
  if (raw.includes("stop")) return "stop";
  if (raw.includes("none") || raw.includes("ning") || raw.includes("sin")) return "none";
  if (raw.includes("limit") || raw.includes("límit") || raw.includes("limite")) return "limit";
  return "limit";
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const raw = value.toLowerCase();
    if (raw === "true" || raw === "si" || raw === "sí" || raw === "yes") return true;
    if (raw === "false" || raw === "no") return false;
  }
  return fallback;
}

function asScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(text(value, 8));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asTargets(value: unknown): Target[] {
  if (!Array.isArray(value)) return [];
  const targets: Target[] = [];
  for (const item of value.slice(0, 3)) {
    const record = asRecord(item);
    const target: Target = {
      label: text(pick(record, ["label", "nombre"]), 16) || `TP${targets.length + 1}`,
      price: text(pick(record, ["price", "precio", "nivel"]), 80),
      rationale: text(pick(record, ["rationale", "razon", "razón", "motivo"]), 280),
      partial: text(pick(record, ["partial", "parcial", "cierre"]), 140),
    };
    if (target.price || target.rationale) targets.push(target);
  }
  return targets;
}

function asRanked(value: unknown): Ranked[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 3).map((item) => {
    const record = asRecord(item);
    return {
      name: text(pick(record, ["name", "nombre", "strategyName"]), 80),
      score: asScore(pick(record, ["score", "puntuacion", "puntuación"])),
      note: text(pick(record, ["note", "nota"]), 180),
    };
  }).filter((item) => item.name);
}

function asList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => text(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normalizeAnalysis(raw: unknown, hintSymbol: string): Analysis {
  const root = asRecord(raw);
  const h4 = asRecord(pick(root, ["h4", "H4", "cuatroH"]));
  const m15 = asRecord(pick(root, ["m15", "M15", "quince"]));
  const plan = asRecord(pick(root, ["plan"]));
  const quality = asRecord(pick(root, ["chartQuality", "calidad"]));

  const analysis: Analysis = {
    headline: text(pick(root, ["headline", "titular"]), 140),
    verdict: asVerdict(pick(root, ["verdict", "veredicto"])),
    direction: asDirection(pick(root, ["direction", "direccion", "dirección"])),
    confidence: asScore(pick(root, ["confidence", "confluencia"])),
    instrument: text(pick(root, ["instrument", "instrumento", "symbol"]), 40) || hintSymbol,
    strategyId: text(pick(root, ["strategyId", "id"]), 40),
    strategyName: text(pick(root, ["strategyName", "estrategia"]), 80),
    whyThisOne: text(pick(root, ["whyThisOne", "porQue", "porqué"]), 400),
    h4: {
      bias: asBias(pick(h4, ["bias", "sesgo"])),
      structure: text(pick(h4, ["structure", "estructura"]), 240),
      narrative: text(pick(h4, ["narrative", "narrativa", "lectura"]), 700),
    },
    m15: {
      trigger: text(pick(m15, ["trigger", "disparo"]), 400),
      location: text(pick(m15, ["location", "ubicacion", "ubicación"]), 240),
      confirmation: text(pick(m15, ["confirmation", "confirmacion", "confirmación"]), 300),
    },
    plan: {
      entryType: asEntry(pick(plan, ["entryType", "tipoEntrada"])),
      entry: text(pick(plan, ["entry", "entrada"]), 80),
      entryRationale: text(pick(plan, ["entryRationale", "razonEntrada"]), 280),
      stop: text(pick(plan, ["stop", "stopLoss"]), 80),
      stopRationale: text(pick(plan, ["stopRationale", "razonStop"]), 280),
      targets: asTargets(pick(plan, ["targets", "objetivos", "takes"])),
      riskReward: text(pick(plan, ["riskReward", "rr"]), 80),
      invalidation: text(pick(plan, ["invalidation", "invalidacion"]), 300),
      management: text(pick(plan, ["management", "gestion", "gestión"]), 400),
    },
    checklist: asList(pick(root, ["checklist"]), 6, 180),
    ranked: asRanked(pick(root, ["ranked", "alternativas"])),
    risks: asList(pick(root, ["risks", "riesgos"]), 4, 220),
    chartQuality: {
      h4Ok: asBool(pick(quality, ["h4Ok"]), true),
      m15Ok: asBool(pick(quality, ["m15Ok"]), true),
      axisReadable: asBool(pick(quality, ["axisReadable"]), false),
      notes: text(pick(quality, ["notes", "notas"]), 300),
    },
  };

  if (!analysis.chartQuality.h4Ok || !analysis.chartQuality.m15Ok) {
    analysis.verdict = "no_operar";
  }

  if (analysis.verdict === "operar" && analysis.direction === "neutral") {
    analysis.verdict = "esperar";
  }

  if (
    analysis.verdict === "operar" &&
    (!analysis.plan.entry || !analysis.plan.stop || analysis.plan.targets.length < 2)
  ) {
    analysis.verdict = "esperar";
    analysis.risks.unshift(
      "Falta una entrada clara, un stop o un segundo objetivo. No es una orden todavía.",
    );
  }

  if (analysis.verdict === "operar" && analysis.confidence < 58) {
    analysis.verdict = "esperar";
    analysis.risks.unshift(
      "La confluencia no llega al mínimo de la mesa. El plan queda en espera.",
    );
  }

  if (!analysis.headline) {
    if (analysis.verdict === "no_operar") analysis.headline = "Estas capturas no dan una orden.";
    else if (analysis.verdict === "esperar") analysis.headline = "Hay una idea, todavía no una entrada.";
    else if (analysis.direction === "corto") analysis.headline = "Corto, con el 4H a favor.";
    else analysis.headline = "Largo, con el 4H a favor.";
  }

  if (!analysis.strategyName) analysis.strategyName = "Sin setup dominante";

  analysis.risks = analysis.risks.slice(0, 4);
  return analysis;
}

export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("La lectura no devolvió un plan legible.");
  }
  return JSON.parse(body.slice(start, end + 1));
}

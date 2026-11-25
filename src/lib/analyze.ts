import { playbookForPrompt } from "@/lib/playbook";
import { extractJson, normalizeAnalysis, type Analysis } from "@/lib/reading";

export type AnalyzeInput = {
  h4: string;
  m15: string;
  symbol: string;
  note: string;
};

export type AnalyzeResponse =
  | { ok: true; analysis: Analysis }
  | { ok: false; error: string };

const MAX_IMAGE = 1_600_000;

function validate(input: unknown): AnalyzeInput {
  if (!input || typeof input !== "object") {
    throw new Error("La petición no es válida.");
  }
  const record = input as Record<string, unknown>;
  const h4 = record.h4;
  const m15 = record.m15;
  if (typeof h4 !== "string" || typeof m15 !== "string") {
    throw new Error("Hacen falta las dos capturas.");
  }
  if (h4.length < 80 || m15.length < 80) {
    throw new Error("Una de las capturas llegó vacía.");
  }
  if (h4.length > MAX_IMAGE || m15.length > MAX_IMAGE) {
    throw new Error("Las capturas pesan demasiado. Acércalas al gráfico y vuelve a subirlas.");
  }
  const symbol = typeof record.symbol === "string" ? record.symbol.trim().slice(0, 40) : "";
  const note = typeof record.note === "string" ? record.note.trim().slice(0, 500) : "";
  return { h4, m15, symbol, note };
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .join("");
}

function systemPrompt(): string {
  return `Eres el lector de NORTE, una mesa de trading. Lees dos capturas y devuelves un plan o un rechazo. No eres un gurú, no prometes rentabilidad y no inventas lo que no está en la imagen.

Jerarquía, sin excepciones:
- La PRIMERA imagen es el contexto de 4 horas. Define sesgo, estructura y zonas.
- La SEGUNDA imagen es el disparo de 15 minutos del MISMO instrumento. Solo dice cuándo y dónde entrar.
- El 15m no autoriza ir contra el 4H, salvo un cambio de carácter del 4H ya confirmado con desplazamiento. No anticipas giros.
- Si el precio de 15m ya se fue de la zona, no des entrada a mercado. Deja un límite y veredicto "esperar".
- El stop va más allá del swing que invalida la idea, con un margen pequeño. No lo pongas en el número redondo donde descansa la liquidez que el precio quiere cazar, si ese número es el imán y no la invalidación.
- TP1: liquidez u objetivo más cercano. Tiene que pagar alrededor de 1R o más. Se cierra una parcial.
- TP2: siguiente pool, extremo del rango o pata medida.
- TP3: solo si hay un imán claro más lejos (equal highs/lows, extensión, extremo del 4H). Si no existe, devuelve DOS targets. Nunca rellenes un tercero.
- Si el camino hasta TP2 paga peor que 1:1.5, el veredicto no puede ser "operar".
- Si la confluencia del setup ganador es menor de 58, veredicto "esperar" o "no_operar".
- No inventes indicadores, volumen, sesiones, EMAs ni precios. Si el eje no se lee, describe la zona respecto a swings visibles y escribe "eje ilegible" en los precios. axisReadable=false.
- Si una captura no es un gráfico, si ambas parecen la misma temporalidad, o si la temporalidad impresa no es 4H en la primera y 15m en la segunda, veredicto "no_operar", h4Ok/m15Ok en false, y explícalo. No fuerces un plan.
- Si 4H y 15m se contradicen, veredicto "esperar".

Cómo eliges:
No existe "la estrategia más rentable" en abstracto. Puntúas el playbook de abajo (0-100) según lo que SE VE. Gana un solo setup: el de mayor confluencia entre lado del 4H, zona y disparo de 15m. Los otros dos mejores van en ranked, con score menor.

Playbook:
${playbookForPrompt()}

Responde SOLO un objeto JSON, sin markdown, con estas claves exactas:
{
  "headline": "una frase concreta en español",
  "verdict": "operar" | "esperar" | "no_operar",
  "direction": "largo" | "corto" | "neutral",
  "confidence": 0-100,
  "instrument": "símbolo leído o el que el usuario dijo",
  "strategyId": "id del playbook",
  "strategyName": "nombre corto",
  "whyThisOne": "por qué ganó a las alternativas, en español",
  "h4": { "bias": "alcista"|"bajista"|"rango"|"incierto", "structure": "", "narrative": "" },
  "m15": { "trigger": "", "location": "", "confirmation": "" },
  "plan": {
    "entryType": "limit"|"market"|"stop"|"none",
    "entry": "precio o zona, o eje ilegible",
    "entryRationale": "",
    "stop": "",
    "stopRationale": "",
    "targets": [ { "label": "TP1", "price": "", "rationale": "", "partial": "qué porción cerrar" } ],
    "riskReward": "1 : x / y / z respecto al stop",
    "invalidation": "qué hecho mata la idea",
    "management": "parciales y cuándo mover el stop a entrada, solo si la estructura lo permite"
  },
  "checklist": ["condiciones que tienen que ser ciertas antes de pulsar"],
  "ranked": [ { "name": "", "score": 0, "note": "" } ],
  "risks": ["riesgos concretos de este gráfico"],
  "chartQuality": { "h4Ok": true, "m15Ok": true, "axisReadable": true, "notes": "" }
}

Todos los textos visibles en español, claros, sin jerga vacía. Precios tal como se leen en el eje, sin redondear a un número que no esté.`;
}

const KEY_STORAGE = "norte-xai-key-v1";

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setApiKey(key: string): void {
  try {
    const clean = key.trim();
    if (clean) localStorage.setItem(KEY_STORAGE, clean);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* sin almacenamiento: la clave solo vive esta sesión */
  }
}

export async function analyzeCharts({ data: raw }: { data: unknown }): Promise<AnalyzeResponse> {
    let data: AnalyzeInput;
    try {
      data = validate(raw);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "La petición no es válida." };
    }
    const apiKey = getApiKey();
    if (!apiKey) {
      return { ok: false, error: "Falta tu clave de xAI. Añádela en Ajustes." };
    }

    const userText = [
      data.symbol ? `El usuario dice que el instrumento es: ${data.symbol}. Si el gráfico muestra otro, manda el gráfico.` : "El usuario no indicó el símbolo. Léelo si aparece.",
      data.note ? `Contexto que la captura puede no mostrar: ${data.note}. No lo trates como si se viera en el precio.` : "",
      "Imagen 1 = gráfico de 4 horas (contexto). Imagen 2 = gráfico de 15 minutos (entrada).",
    ]
      .filter(Boolean)
      .join("\n");

    let response: Response;
    try {
      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.2,
          max_tokens: 3500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt() },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${data.h4}`, detail: "high" },
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${data.m15}`, detail: "high" },
                },
              ],
            },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "La lectura no respondió a tiempo. Prueba otra vez en un momento." };
    }

    if (!response.ok) {
      const detail = (await response.text()).replace(/[A-Za-z0-9_\-]{24,}/g, "").slice(0, 160);
      return {
        ok: false,
        error: `No se pudo leer el mercado (${response.status}). ${detail}`.trim(),
      };
    }

    const body = (await response.json()) as {
      choices?: { finish_reason?: string; message?: { content?: unknown } }[];
    };
    const choice = body.choices?.[0];
    const content = messageText(choice?.message?.content);
    if (!content) {
      return { ok: false, error: "La lectura volvió vacía. Prueba con capturas más nítidas." };
    }
    if (choice?.finish_reason === "length") {
      return { ok: false, error: "La lectura se cortó antes de cerrar el plan. Prueba otra vez." };
    }

    try {
      const analysis = normalizeAnalysis(extractJson(content), data.symbol);
      return { ok: true, analysis };
    } catch {
      return { ok: false, error: "La lectura no se pudo ordenar en un ticket. Prueba otra vez." };
    }
  }

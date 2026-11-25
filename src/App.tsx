import { Compass, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ChartSlot } from "@/components/chart-slot";
import { Ticket } from "@/components/ticket";
import { analyzeCharts, getApiKey, setApiKey } from "@/lib/analyze";
import { compressChart, jpegPayload } from "@/lib/image";
import { FAMILIES, SETUPS } from "@/lib/playbook";
import type { Analysis } from "@/lib/reading";

const HISTORY_KEY = "norte-tickets-v1";

type SavedTicket = {
  id: string;
  at: string;
  analysis: Analysis;
};

const STEPS = [
  {
    n: "01",
    title: "El 4H dice el lado",
    body: "Misma plataforma y mismo símbolo. Deja ver estructura: swings, zonas y el eje de precio.",
  },
  {
    n: "02",
    title: "El 15m dice cuándo",
    body: "La segunda captura es solo el disparo. Tiene que ser el gráfico de 15 minutos, no otro 4H.",
  },
  {
    n: "03",
    title: "Un plan, o ninguno",
    body: "Entrada, stop y dos objetivos. El tercero solo aparece si hay un imán claro más lejos.",
  },
];

function loadHistory(): SavedTicket[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTicket[];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [h4, setH4] = useState<string | null>(null);
  const [m15, setM15] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [fromHistory, setFromHistory] = useState(false);
  const [history, setHistory] = useState<SavedTicket[]>([]);
  const [keyDraft, setKeyDraft] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    const stored = getApiKey();
    setHasKey(Boolean(stored));
    setShowKey(!stored);
  }, []);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
        item.type.startsWith("image/"),
      );
      if (!file) return;
      event.preventDefault();
      void compressChart(file)
        .then((dataUrl) => {
          setError(null);
          if (!h4) setH4(dataUrl);
          else if (!m15) setM15(dataUrl);
          else setM15(dataUrl);
        })
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : "No pude pegar esa captura.");
        });
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [h4, m15]);

  async function onAnalyze() {
    if (!h4 || !m15 || busy) return;
    if (!getApiKey()) {
      setShowKey(true);
      setError("Añade tu clave de xAI en Ajustes para poder leer las capturas.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await analyzeCharts({
        data: {
          h4: jpegPayload(h4),
          m15: jpegPayload(m15),
          symbol,
          note,
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAnalysis(result.analysis);
      setFromHistory(false);
      const entry: SavedTicket = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        analysis: result.analysis,
      };
      const next = [entry, ...history].slice(0, 6);
      setHistory(next);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      if (window.innerWidth < 1024) {
        document.getElementById("ticket")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      setError("No se pudo completar la lectura. Revisa las capturas e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(h4 && m15);

  return (
    <main className="min-h-screen pb-16">
      <header className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-end sm:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-brass">
            <Compass className="size-5" aria-hidden="true" />
            <p className="font-editorial text-3xl leading-none text-fg">Norte</p>
          </div>
          <h1 className="mt-3 max-w-xl text-lg text-fg sm:text-xl">
            El 4H marca el lado. El 15m marca la entrada.
          </h1>
        </div>
        <p className="max-w-xs text-sm text-muted">
          De un playbook de estructura, liquidez y precio, se queda el setup con más confluencia. O no opera.
        </p>
      </header>

      <section className="mx-auto mt-6 max-w-6xl px-4 lg:px-8">
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-fg/15 px-4 text-sm text-fg"
        >
          <KeyRound className="size-4 text-brass" aria-hidden="true" />
          Ajustes · {hasKey ? "clave guardada" : "falta la clave"}
        </button>
        {showKey ? (
          <div className="mt-3 max-w-xl rounded-2xl border border-fg/10 bg-fg/5 p-4">
            <label className="block">
              <span className="text-xs tracking-widest text-muted uppercase">Clave de API de xAI</span>
              <input
                type="password"
                value={keyDraft}
                onChange={(event) => setKeyDraft(event.target.value)}
                placeholder={hasKey ? "Ya hay una guardada. Pega otra para cambiarla." : "xai-…"}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="mt-2 h-12 w-full rounded-xl border border-fg/15 bg-fg/5 px-3 text-fg outline-none placeholder:text-muted"
              />
            </label>
            <p className="mt-2 text-xs text-muted">
              Se guarda solo en este teléfono y se envía únicamente a api.x.ai para leer tus capturas.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={!keyDraft.trim()}
                onClick={() => {
                  setApiKey(keyDraft);
                  setKeyDraft("");
                  setHasKey(true);
                  setShowKey(false);
                  setError(null);
                }}
                className="h-11 rounded-full bg-brass px-5 text-sm font-medium text-ink disabled:opacity-40"
              >
                Guardar
              </button>
              {hasKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setApiKey("");
                    setHasKey(false);
                    setKeyDraft("");
                  }}
                  className="h-11 rounded-full border border-fg/15 px-5 text-sm text-fg"
                >
                  Borrar clave
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="mx-auto mt-8 grid max-w-6xl gap-8 px-4 lg:grid-cols-12 lg:px-8">
        <form
          className="min-w-0 space-y-4 lg:col-span-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onAnalyze();
          }}
        >
          <ChartSlot
            kicker="Contexto"
            title="4H"
            hint="Cómo se mueve el mercado. Estructura, zonas y eje de precio."
            image={h4}
            onImage={(dataUrl) => {
              setH4(dataUrl);
              setError(null);
            }}
            onClear={() => setH4(null)}
            onError={setError}
            compress={compressChart}
          />
          <ChartSlot
            kicker="Disparo"
            title="15m"
            hint="Dónde entrar. El mismo símbolo, en quince minutos."
            image={m15}
            onImage={(dataUrl) => {
              setM15(dataUrl);
              setError(null);
            }}
            onClear={() => setM15(null)}
            onError={setError}
            compress={compressChart}
          />

          <label className="block">
            <span className="text-xs tracking-widest text-muted uppercase">Símbolo, si el recorte lo cortó</span>
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="EURUSD, BTC, oro…"
              maxLength={40}
              className="mt-2 h-12 w-full rounded-xl border border-fg/15 bg-fg/5 px-3 text-fg outline-none placeholder:text-muted"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-widest text-muted uppercase">Contexto que no sale en la foto</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Sesión, noticia, lo que quieras que la mesa tenga en cuenta."
              maxLength={500}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-fg/15 bg-fg/5 px-3 py-3 text-sm text-fg outline-none placeholder:text-muted"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl border border-clay/40 bg-clay/10 px-3 py-3 text-sm text-fg">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!ready || busy}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brass text-sm font-medium text-ink transition-opacity duration-200 disabled:opacity-40"
          >
            {busy ? "Leyendo el 4H y el 15m…" : "Leer las dos capturas"}
          </button>
          <p className="text-xs text-muted">
            También puedes pegar una captura: la primera va al 4H, la segunda al 15m.
          </p>

          {history.length > 0 ? (
            <div className="pt-2">
              <h2 className="text-xs tracking-widest text-muted uppercase">Tickets guardados en este teléfono</h2>
              <ul className="mt-2 divide-y divide-fg/10">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-baseline justify-between gap-3 py-3 text-left"
                      onClick={() => {
                        setAnalysis(item.analysis);
                        setFromHistory(true);
                        setError(null);
                      }}
                    >
                      <span className="min-w-0 truncate text-sm text-fg">
                        {item.analysis.instrument || "Sin símbolo"} · {item.analysis.strategyName}
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {new Date(item.at).toLocaleString("es", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </form>

        <div id="ticket" className="min-w-0 lg:col-span-8">
          <div aria-live="polite">
            {analysis ? (
              <Ticket analysis={analysis} saved={fromHistory} />
            ) : (
              <section className="h-full rounded-2xl border border-fg/10 bg-fg/5 p-5 sm:p-6">
                <p className="text-xs tracking-widest text-brass uppercase">Antes de subir</p>
                <h2 className="font-editorial mt-2 text-3xl text-fg sm:text-4xl">Dos capturas. Un solo plan.</h2>
                <p className="mt-3 max-w-xl text-sm text-muted">
                  No se promedia un montón de sistemas. Se puntúan los que de verdad se ven en el 4H y se
                  confirma, o se descarta, en el 15m. Si el segundo objetivo no paga, no hay orden.
                </p>
                <ol className="mt-6 space-y-4">
                  {STEPS.map((step) => (
                    <li key={step.n} className="flex gap-3">
                      <span className="font-editorial text-brass tabular-nums">{step.n}</span>
                      <span>
                        <span className="block text-fg">{step.title}</span>
                        <span className="mt-1 block text-sm text-muted">{step.body}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>
      </div>

      <section className="mx-auto mt-14 max-w-6xl px-4 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-editorial text-3xl">Lo que la mesa compara</h2>
          <p className="mt-2 text-sm text-muted">
            Estructura, liquidez, zonas, precio clásico y el disparo de 15 minutos. Gana uno. El resto queda
            como alternativa, con su nota, para que veas por qué no se eligió.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIES.map((family) => (
            <article key={family.id} className="rounded-2xl border border-fg/10 p-4">
              <h3 className="text-fg">{family.title}</h3>
              <p className="mt-1 text-sm text-muted">{family.blurb}</p>
              <ul className="mt-3 space-y-2">
                {SETUPS.filter((setup) => setup.family === family.id).map((setup) => (
                  <li key={setup.id} className="text-sm">
                    <span className="text-fg">{setup.name}. </span>
                    <span className="text-muted">{setup.edge}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-xs text-muted">
          Esto es una lectura educativa de tus capturas, no asesoramiento ni una orden. El mercado puede saltar
          el stop. El tamaño de la posición lo decides tú.
        </p>
      </section>
    </main>
  );
}

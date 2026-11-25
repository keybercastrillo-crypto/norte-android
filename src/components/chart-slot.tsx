import { useId, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type ChartSlotProps = {
  kicker: string;
  title: string;
  hint: string;
  image: string | null;
  onImage: (dataUrl: string) => void;
  onClear: () => void;
  onError: (message: string) => void;
  compress: (file: File) => Promise<string>;
};

export function ChartSlot({
  kicker,
  title,
  hint,
  image,
  onImage,
  onClear,
  onError,
  compress,
}: ChartSlotProps) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onImage(await compress(file));
    } catch (error) {
      onError(error instanceof Error ? error.message : "No pude usar esa captura.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border bg-fg/5 transition-colors duration-200 " +
        (over ? "border-brass" : "border-fg/15")
      }
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        void accept(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          void accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {image ? (
        <div className="relative">
          <img src={image} alt={`Captura del gráfico de ${title}`} className="aspect-video w-full object-cover" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="rounded-full bg-bg/80 px-3 py-1 text-xs font-medium text-fg">{title}</span>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full bg-bg/80 text-fg"
              aria-label={`Quitar captura de ${title}`}
              onClick={onClear}
            >
              <X className="size-4" />
            </button>
          </div>
          <label
            htmlFor={inputId}
            className="absolute inset-x-0 bottom-0 cursor-pointer bg-bg/75 px-3 py-3 text-center text-sm text-fg"
          >
            Cambiar captura
          </label>
        </div>
      ) : (
        <label htmlFor={inputId} className="flex aspect-video cursor-pointer flex-col justify-between p-4">
          <span className="text-xs tracking-widest text-brass uppercase">{kicker}</span>
          <span>
            <span className="font-editorial block text-4xl leading-none text-fg">{title}</span>
            <span className="mt-2 block max-w-xs text-sm text-muted">{busy ? "Preparando la captura…" : hint}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-fg">
            <ImagePlus className="size-4 text-brass" />
            Subir o soltar
          </span>
        </label>
      )}
    </div>
  );
}

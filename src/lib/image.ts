function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pude leer esa imagen. Usa JPG o PNG."));
    };
    image.src = url;
  });
}

function paint(image: HTMLImageElement, maxWidth: number, quality: number): string {
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pude preparar la captura.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function compressChart(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Eso no parece una imagen. Sube la captura del gráfico.");
  }
  const image = await loadImage(file);
  let dataUrl = paint(image, 1280, 0.72);
  if (dataUrl.length > 1_400_000) dataUrl = paint(image, 1100, 0.6);
  if (dataUrl.length > 1_400_000) dataUrl = paint(image, 900, 0.52);
  return dataUrl;
}

export function jpegPayload(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

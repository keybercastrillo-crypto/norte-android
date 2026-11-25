export type Family = {
  id: string;
  title: string;
  blurb: string;
};

export type Setup = {
  id: string;
  family: string;
  name: string;
  edge: string;
};

export const FAMILIES: Family[] = [
  {
    id: "estructura",
    title: "Estructura 4H",
    blurb: "El lado lo decide el gráfico de 4 horas. Sin estructura, no hay orden.",
  },
  {
    id: "liquidez",
    title: "Liquidez",
    blurb: "Los barridos de máximos y mínimos son la trampa. La entrada es después, no en la mecha.",
  },
  {
    id: "zonas",
    title: "Zonas",
    blurb: "Oferta, demanda, order blocks y huecos. El 15m solo dispara dentro de la zona del 4H.",
  },
  {
    id: "clasico",
    title: "Precio clásico",
    blurb: "Soportes, canales y figuras. Cuentan si se ven, no si hay que imaginarlas.",
  },
  {
    id: "medida",
    title: "Medida",
    blurb: "Retrocesos y objetivos medidos. Sirven para ubicar, no para adivinar.",
  },
  {
    id: "disparo",
    title: "Disparo 15m",
    blurb: "La vela de 15 minutos es el gatillo. Nunca el motivo para ir contra el 4H.",
  },
];

export const SETUPS: Setup[] = [
  {
    id: "trend-long",
    family: "estructura",
    name: "Continuación alcista",
    edge: "Máximos y mínimos crecientes. Se compra el retroceso, no el techo.",
  },
  {
    id: "trend-short",
    family: "estructura",
    name: "Continuación bajista",
    edge: "Máximos y mínimos decrecientes. Se vende el rebote, no el suelo.",
  },
  {
    id: "bos-retest",
    family: "estructura",
    name: "Ruptura y retest",
    edge: "La estructura ya se rompió. La entrada es el regreso a la zona rota, no el breakout tardío.",
  },
  {
    id: "choch",
    family: "estructura",
    name: "Cambio de carácter",
    edge: "Solo si el 4H ya giró con desplazamiento. Una mecha no es un giro.",
  },
  {
    id: "range-extreme",
    family: "estructura",
    name: "Extremo de rango",
    edge: "Rechazo en el borde. Objetivo el otro lado. Stop fuera del rango.",
  },
  {
    id: "range-fakeout",
    family: "estructura",
    name: "Falsa ruptura de rango",
    edge: "Sale del rango y cierra de vuelta dentro. Se opera el regreso, no la esperanza.",
  },
  {
    id: "sweep-lows",
    family: "liquidez",
    name: "Barrido de mínimos",
    edge: "Caza el stop bajo un mínimo y desplaza al alza. Entrada en el retroceso del impulso.",
  },
  {
    id: "sweep-highs",
    family: "liquidez",
    name: "Barrido de máximos",
    edge: "Caza el stop sobre un máximo y desplaza a la baja. No se vende la mecha: se vende el regreso.",
  },
  {
    id: "eq-magnet",
    family: "liquidez",
    name: "Equal highs o lows",
    edge: "Igualdad de máximos o mínimos como imán del objetivo, no como entrada ciega.",
  },
  {
    id: "inducement",
    family: "liquidez",
    name: "Inducement",
    edge: "La primera liquidez es la trampa. La zona útil está detrás de ese barrido menor.",
  },
  {
    id: "ob-mitigation",
    family: "zonas",
    name: "Order block a favor",
    edge: "Última vela contraria antes del impulso del 4H. Entrada al mitigar, en dirección del sesgo.",
  },
  {
    id: "breaker",
    family: "zonas",
    name: "Breaker",
    edge: "Un order block que falló y, tras el quiebre, se opera del otro lado.",
  },
  {
    id: "fvg",
    family: "zonas",
    name: "Fair value gap",
    edge: "Hueco de impulso. El 15m entra en el relleno parcial, no cuando ya se cerró entero.",
  },
  {
    id: "sd-fresh",
    family: "zonas",
    name: "Oferta o demanda fresca",
    edge: "Zona poco visitada de donde salió el impulso. Pierde valor si ya fue mitigada varias veces.",
  },
  {
    id: "sr-retest",
    family: "zonas",
    name: "Soporte o resistencia",
    edge: "Nivel obvio con rechazo y retest. Sin rechazo en 15m, no hay disparo.",
  },
  {
    id: "ema-pullback",
    family: "clasico",
    name: "Pullback a medias",
    edge: "Solo si el gráfico muestra EMA 20 o 50 y el 4H tiende. La media no se inventa.",
  },
  {
    id: "ema200-filter",
    family: "clasico",
    name: "Filtro de EMA 200",
    edge: "Si se ve la 200, define el lado. El disparo sigue siendo un retroceso de 15m.",
  },
  {
    id: "tl-retest",
    family: "clasico",
    name: "Tendencia rota y retest",
    edge: "Línea clara, rota con cierre, y el precio vuelve a ella. Sin línea visible, no aplica.",
  },
  {
    id: "double-tap",
    family: "clasico",
    name: "Doble suelo o techo",
    edge: "Dos pruebas al mismo nivel y neckline identificable. El objetivo es la medida de la figura.",
  },
  {
    id: "flag",
    family: "clasico",
    name: "Bandera o triángulo",
    edge: "Pausa estrecha a favor del impulso 4H. Entrada en ruptura con hold, o en el retroceso del break.",
  },
  {
    id: "channel",
    family: "clasico",
    name: "Extremo de canal",
    edge: "Canal paralelo visible. Se opera el extremo a favor de la inclinación, no el medio.",
  },
  {
    id: "ote",
    family: "medida",
    name: "Retroceso 62–79%",
    edge: "OTE del último impulso 4H. El 15m confirma dentro de esa bolsa.",
  },
  {
    id: "fib50",
    family: "medida",
    name: "Retroceso del 50%",
    edge: "En tendencia fuerte, el equilibrio del impulso basta. No fuerza un 61.8 que no está en precio.",
  },
  {
    id: "measured-leg",
    family: "medida",
    name: "Pata medida",
    edge: "AB=CD o impulso simétrico como TP2 o TP3, no como excusa para entrar tarde.",
  },
  {
    id: "extension",
    family: "medida",
    name: "Extensión 1.27 / 1.62",
    edge: "Objetivo lejano si el camino está limpio. Nunca es la entrada.",
  },
  {
    id: "engulf",
    family: "disparo",
    name: "Envolvente en zona",
    edge: "Vela 15m que envuelve a la previa, dentro de la zona del 4H y a favor del sesgo.",
  },
  {
    id: "pin",
    family: "disparo",
    name: "Pin bar en zona",
    edge: "Mecha de rechazo que deja el cierre del lado correcto. La mecha marca el stop.",
  },
  {
    id: "inside-break",
    family: "disparo",
    name: "Inside bar a favor",
    edge: "Madre e inside. Se entra con el cierre fuera, en la dirección del 4H, stop al otro lado de la madre.",
  },
  {
    id: "micro-bos",
    family: "disparo",
    name: "Micro quiebre 15m",
    edge: "El 15m rompe su último swing a favor, con cierre. La mecha sola no cuenta.",
  },
  {
    id: "displacement-wait",
    family: "disparo",
    name: "No perseguir el impulso",
    edge: "Si el 15m ya se fue, la orden es limitada en la mitigación. Mercado aquí es llegar tarde.",
  },
  {
    id: "breakout-hold",
    family: "disparo",
    name: "Ruptura sostenida",
    edge: "Dos o tres cierres de 15m fuera del nivel, no la primera mecha. Stop de vuelta dentro.",
  },
  {
    id: "rsi-div",
    family: "disparo",
    name: "Divergencia visible",
    edge: "Solo si el RSI o el MACD están en la captura, en un extremo del 4H, y el 15m dispara.",
  },
  {
    id: "volume-climax",
    family: "disparo",
    name: "Clímax de volumen",
    edge: "Solo si hay volumen. Picos en el barrido y la vela siguiente no continúa.",
  },
  {
    id: "killzone",
    family: "disparo",
    name: "Apertura de sesión",
    edge: "Solo si se ve la hora. El barrido de Londres o Nueva York más desplazamiento.",
  },
  {
    id: "vwap-reject",
    family: "clasico",
    name: "Rechazo de VWAP",
    edge: "Solo si el VWAP está dibujado. A favor del 4H, nunca como sistema único.",
  },
];

export function playbookForPrompt(): string {
  return SETUPS.map((setup) => `- ${setup.id}: ${setup.name}. ${setup.edge}`).join("\n");
}

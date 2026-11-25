import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.norte.trading",
  appName: "Norte",
  webDir: "dist",
  backgroundColor: "#12110e",
  plugins: {
    // Hace que fetch() salga por la red nativa de Android y evita bloqueos CORS al llamar a api.x.ai
    CapacitorHttp: { enabled: true },
  },
};

export default config;

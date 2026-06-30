import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Force emptyOutDir to false across all Vite 8 environments to prevent assets cleaning
const disableEmptyOutDir = () => ({
  name: "disable-empty-out-dir",
  config(config: any) {
    if (!config.build) config.build = {};
    config.build.emptyOutDir = false;
    if (config.environments) {
      for (const env of Object.values(config.environments) as any[]) {
        if (!env.build) env.build = {};
        env.build.emptyOutDir = false;
      }
    }
  }
});

export default defineConfig({
  plugins: [
    disableEmptyOutDir(),
    cloudflare({
      viteEnvironment: { name: "ssr" }
    }),
    tailwindcss(),
    reactRouter()
  ],
  build: {
    emptyOutDir: false,
  },
  resolve: {
    tsconfigPaths: true,
  },
});

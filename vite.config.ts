import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    cloudflare(),
    devServer({
      entry: "src/index.ts",
      adapter: cloudflareAdapter,
    }),
    tailwindcss(),
  ],
  build: {
    manifest: true, // Ensure manifest.json is generated
  },
});

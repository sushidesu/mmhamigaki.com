import { defineConfig } from "vite";
import honox from "honox/vite";
import build from "@hono/vite-build/cloudflare-workers";
import adapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    honox({
      devServer: {
        adapter,
      },
      client: {
        input: ["/app/client.ts", "/app/styles/input.css"],
      },
    }),
    build(),
    tailwindcss(),
  ],
});

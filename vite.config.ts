import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createHash } from "crypto";

/**
 * Adds a strict Content-Security-Policy to the production index.html.
 * Inline scripts (the theme snippet) are allowed by their exact SHA-256 hash
 * instead of 'unsafe-inline'. Skipped in dev, where hot reload injects scripts.
 */
function cspPlugin(apiUrl: string): Plugin {
  return {
    name: "dailyd-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          ([, code]) => `'sha256-${createHash("sha256").update(code).digest("base64")}'`,
        );
        const apiOrigin = new URL(apiUrl).origin;
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(" ")}`,
          "style-src 'self' 'unsafe-inline'",
          // Article images come from each publisher, so any https host is allowed.
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          `connect-src 'self' ${apiOrigin}`,
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join("; ");
        return html.replace(
          "<!-- Content-Security-Policy is added at build time by vite.config.ts (cspPlugin). -->",
          `<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    server: {
      // Local only. Use `npm run dev -- --host` to test from a phone on your Wi-Fi.
      host: "localhost",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), cspPlugin(env.VITE_API_BASE_URL || "http://localhost:8000")],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});

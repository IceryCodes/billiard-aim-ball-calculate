import { resolve as pathResolve } from "node:path";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: +(process.env.PORT ?? 3000) || 3000,
      host: "::1",
    },
    preview: {
      port: 4300,
      host: "::1",
    },
    build: {
      outDir: "build/dist",
    },
    plugins: [react()],
    css: {
      modules: {
        localsConvention: "camelCase",
      },
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": pathResolve(__dirname, "./src"),
      },
    },
    define: {
      ...Object.keys(env).reduce((prev, key) => {
        prev[`process.env.${key}`] = JSON.stringify(env[key]);
        return prev;
      }, {}),
    },
  };
});

import { resolve as pathResolve } from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
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
  };
});

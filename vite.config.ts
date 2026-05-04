import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import { viteObfuscateFile } from "vite-plugin-obfuscator";

// Plugin obfuscator: bundle dùng transformIndexHtml + API deprecated (enforce/transform) — không có bản Vite 5+ thay thế sẵn; chờ upstream hoặc wrap riêng.
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      include: "**/*.{jsx,js,tsx,ts}",
    }),
    svgr(),
    ...(mode === "production"
      ? [
          viteObfuscateFile({
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            debugProtectionInterval: 0,
            disableConsoleOutput: false,
            identifierNamesGenerator: "hexadecimal",
            log: false,
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: true,
            shuffleStringArray: true,
            splitStrings: false,
            stringArray: true,
            stringArrayEncoding: ["base64"],
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["honor.wellspring.edu.vn"],
  },
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/gsap")) return "vendor-gsap";
          if (id.includes("@splidejs")) return "vendor-splide";
          if (id.includes("swiper")) return "vendor-swiper";
          if (id.includes("i18next") || id.includes("react-i18next"))
            return "vendor-i18n";
          if (id.includes("node_modules/react") || id.includes("react-dom"))
            return "vendor-react";
          if (id.includes("node_modules/axios")) return "vendor-axios";
          return undefined;
        },
      },
    },
  },
}));

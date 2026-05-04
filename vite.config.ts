import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import { obfuscate } from "javascript-obfuscator";

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal" as const,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  splitStrings: false,
  stringArray: true,
  stringArrayEncoding: ["base64"] as const,
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
};

/**
 * Obfuscate (tùy chọn): VITE_ENABLE_OBFUSCATE=true — mặc định tắt (hay phá Swiper/Splide).
 * Chỉ chunk không có "vendor-" trong tên.
 */
function viteObfuscateNonVendor() {
  return {
    name: "vite:obfuscate-non-vendor",
    transformIndexHtml: {
      enforce: "post" as const,
      transform(
        html: string,
        ctx: { bundle?: Record<string, { code?: string }> },
      ) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (!chunk?.code) continue;
          if (fileName.includes("vendor-")) continue;
          chunk.code = obfuscate(chunk.code, OBFUSCATOR_OPTIONS).getObfuscatedCode();
        }
        return html;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableObfuscate =
    mode === "production" && env.VITE_ENABLE_OBFUSCATE === "true";

  return {
    plugins: [
      react({
        include: "**/*.{jsx,js,tsx,ts}",
      }),
      svgr(),
      ...(enableObfuscate ? [viteObfuscateNonVendor()] : []),
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
  };
});

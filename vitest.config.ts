import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";

const root=fileURLToPath(new URL(".",import.meta.url));

/**
 * Keep Vitest isolated from the production vinext/Cloudflare Vite graph.
 * Loading vite.config.ts inside Vitest creates multiple Vite environments and
 * can attach more than one server to the same config. Unit/regression tests only
 * need TypeScript transforms and the @/* source alias.
 */
export default defineConfig({
  resolve:{
    alias:{"@":root},
  },
  test:{
    include:["tests/**/*.test.ts","tests/**/*.test.tsx"],
    environment:"node",
    globals:false,
  },
});

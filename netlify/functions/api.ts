import type { Handler, HandlerContext, HandlerEvent } from "@netlify/functions";
import serverless from "serverless-http";
import path from "node:path";
import { createRequire } from "node:module";

let cachedHandler: ReturnType<typeof serverless> | undefined;
let bootstrapError: string | undefined;

function loadApp() {
  process.env.SERVERLESS = "1";
  process.env.NODE_ENV = "production";

  const bundlePath = path.join(process.cwd(), "dist", "index.cjs");

  // Netlify empaqueta la función como CJS — import.meta.url queda undefined.
  // createRequire desde package.json o __filename funciona en Lambda.
  const requireFrom =
    typeof __filename !== "undefined"
      ? __filename
      : path.join(process.cwd(), "package.json");

  const req = createRequire(requireFrom);
  const mod = req(bundlePath) as { app?: Parameters<typeof serverless>[0] };

  if (!mod?.app) {
    throw new Error(`dist/index.cjs no exporta app (buscado en ${bundlePath})`);
  }

  return mod.app;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    if (!cachedHandler) {
      if (bootstrapError) {
        return {
          statusCode: 503,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "API bootstrap failed", detail: bootstrapError }),
        };
      }
      cachedHandler = serverless(loadApp());
    }

    context.callbackWaitsForEmptyEventLoop = false;
    return await cachedHandler(event, context);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    bootstrapError = message;
    console.error("[netlify/functions/api]", err);
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Netlify API function error",
        detail: message,
        path: event.path,
        cwd: process.cwd(),
      }),
    };
  }
};

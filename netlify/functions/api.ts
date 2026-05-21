import type { Handler, HandlerContext, HandlerEvent } from "@netlify/functions";
import serverless from "serverless-http";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let cachedHandler: ReturnType<typeof serverless> | undefined;
let bootstrapError: string | undefined;

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

      process.env.SERVERLESS = "1";
      process.env.NODE_ENV = "production";

      // Usa el bundle generado por npm run build (evita re-bundlear server/ en Netlify)
      const mod = require("../../dist/index.cjs") as { app?: Parameters<typeof serverless>[0] };
      if (!mod?.app) {
        throw new Error("dist/index.cjs no exporta app — ejecuta npm run build antes del deploy");
      }

      cachedHandler = serverless(mod.app);
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
      }),
    };
  }
};

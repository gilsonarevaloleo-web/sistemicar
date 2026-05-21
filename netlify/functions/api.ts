import type { Handler, HandlerContext, HandlerEvent } from "@netlify/functions";
import serverless from "serverless-http";

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
      process.env.NODE_ENV = process.env.NODE_ENV || "production";
      const mod = await import("../../server/index.ts");
      if (!mod.app) {
        throw new Error("server/index.ts did not export app");
      }
      cachedHandler = serverless(mod.app);
    }

    context.callbackWaitsForEmptyEventLoop = false;
    const result = await cachedHandler(event, context);
    return result;
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

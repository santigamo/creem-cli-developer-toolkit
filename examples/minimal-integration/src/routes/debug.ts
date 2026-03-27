import type { Hono } from "hono";

import { getRuntimeConfig, summarizeConfig } from "../creem";
import { getDebugSnapshot } from "../lib/state-store";

export function registerDebugRoute(app: Hono): void {
  app.get("/api/debug/state", async (c) => {
    const config = getRuntimeConfig();
    const snapshot = await getDebugSnapshot();

    return c.json({
      ok: true,
      config: summarizeConfig(config),
      ...snapshot,
    });
  });
}


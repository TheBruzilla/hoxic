"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BootstrapPayload,
  UnauthorizedError,
  getAiConfig,
  getHeartbeat,
  normalizeBotRecord,
  normalizeManageableGuildRecord,
  requestJson,
} from "@/lib/console";

interface ConsoleContextValue {
  bootstrap: BootstrapPayload | null;
  loading: boolean;
  error: string | null;
  unauthorized: boolean;
  refresh: () => Promise<void>;
  getHeartbeatForBot: (botId: string) => ReturnType<typeof getHeartbeat>;
  getAiForBot: (botId: string) => ReturnType<typeof getAiConfig>;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  const bots = Array.isArray(payload.bots) ? payload.bots.map(normalizeBotRecord) : [];

  return {
    ...payload,
    bots,
    manageableGuilds: Array.isArray(payload.manageableGuilds)
      ? payload.manageableGuilds.map(guild => normalizeManageableGuildRecord(guild, bots))
      : [],
  };
}

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await requestJson<BootstrapPayload>("/api/bootstrap");
      setBootstrap(normalizeBootstrapPayload(payload));
      setUnauthorized(false);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        setUnauthorized(true);
        setBootstrap(null);
        setError(null);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<ConsoleContextValue>(
    () => ({
      bootstrap,
      loading,
      error,
      unauthorized,
      refresh,
      getHeartbeatForBot: botId => getHeartbeat(bootstrap, botId),
      getAiForBot: botId => getAiConfig(bootstrap, botId),
    }),
    [bootstrap, loading, error, unauthorized, refresh],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error("useConsole must be used within a ConsoleProvider");
  }
  return context;
}

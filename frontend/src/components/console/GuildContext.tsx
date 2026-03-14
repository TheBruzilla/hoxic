"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GUILD_STORAGE_KEY = "hoxiq:selected-guild";

interface GuildContextValue {
  selectedGuildId: string;
  setSelectedGuildId: (guildId: string) => void;
}

const GuildContext = createContext<GuildContextValue | null>(null);

function resolveGuildId(pathname: string | null, searchParams: URLSearchParams | null) {
  if (searchParams) {
    const searchGuildId = searchParams.get("guild") || "";
    if (searchGuildId) {
      return searchGuildId;
    }
  }

  if (!pathname) {
    return "";
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 3 && parts[0] === "app" && parts[2] === "modules") {
    return parts[1] || "";
  }

  return "";
}

export function GuildContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedGuildId, setSelectedGuildIdState] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const routeGuildId = resolveGuildId(pathname, searchParams);
    if (routeGuildId) {
      setSelectedGuildIdState(routeGuildId);
      window.localStorage.setItem(GUILD_STORAGE_KEY, routeGuildId);
      return;
    }

    const storedGuildId = window.localStorage.getItem(GUILD_STORAGE_KEY) || "";
    if (storedGuildId) {
      setSelectedGuildIdState(current => current || storedGuildId);
    }
  }, [pathname, searchParams]);

  const setSelectedGuildId = useCallback((guildId: string) => {
    setSelectedGuildIdState(guildId);
    if (typeof window !== "undefined") {
      if (guildId) {
        window.localStorage.setItem(GUILD_STORAGE_KEY, guildId);
      } else {
        window.localStorage.removeItem(GUILD_STORAGE_KEY);
      }
    }
  }, []);

  const value = useMemo<GuildContextValue>(
    () => ({
      selectedGuildId,
      setSelectedGuildId,
    }),
    [selectedGuildId, setSelectedGuildId],
  );

  return <GuildContext.Provider value={value}>{children}</GuildContext.Provider>;
}

export function useGuildContext() {
  const context = useContext(GuildContext);
  if (!context) {
    throw new Error("useGuildContext must be used within a GuildContextProvider");
  }
  return context;
}

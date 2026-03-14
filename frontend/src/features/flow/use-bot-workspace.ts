"use client";

import { useEffect, useState } from "react";
import { BotWorkspacePayload, requestJson } from "@/lib/console";

interface BotWorkspaceQueryState {
  loading: boolean;
  error: string | null;
  payload: BotWorkspacePayload | null;
}

export function useBotWorkspace(botId: string) {
  const [state, setState] = useState<BotWorkspaceQueryState>({
    loading: Boolean(botId),
    error: null,
    payload: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!botId) {
      setState({ loading: false, error: null, payload: null });
      return () => {
        cancelled = true;
      };
    }

    setState(current => ({ ...current, loading: true, error: null }));

    void requestJson<BotWorkspacePayload>(`/api/bots/${botId}`)
      .then(payload => {
        if (!cancelled) {
          setState({ loading: false, error: null, payload });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load bot workspace.",
            payload: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [botId]);

  return state;
}

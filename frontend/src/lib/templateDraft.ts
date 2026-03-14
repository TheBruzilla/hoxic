"use client";

import { useEffect, useState } from "react";

const TEMPLATE_DRAFT_EVENT = "hoxiq-template-draft-change";

type Listener = () => void;

type TemplateDraftRecord =
  | { state: "selected"; templateKey: string }
  | { state: "cleared" };

const listeners = new Set<Listener>();
const draftCache = new Map<string, TemplateDraftRecord | null>();

function getDraftCacheKey(guildId: string, scope: string) {
  return `${guildId}:${scope}`;
}

function getGuildTemplateDraftKey(guildId: string, scope = "guild") {
  return scope === "guild"
    ? `hoxiq.guild-template.${guildId}`
    : `hoxiq.guild-template.${guildId}.${scope}`;
}

function emitTemplateDraftChange() {
  for (const listener of listeners) {
    listener();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TEMPLATE_DRAFT_EVENT));
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  function handleStorage() {
    listener();
  }

  if (typeof window !== "undefined") {
    window.addEventListener(TEMPLATE_DRAFT_EVENT, handleStorage);
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener(TEMPLATE_DRAFT_EVENT, handleStorage);
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function parseTemplateDraftRecord(value: string | null): TemplateDraftRecord | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && "state" in parsed) {
      const state = (parsed as { state?: unknown }).state;
      if (state === "cleared") {
        return { state: "cleared" };
      }

      if (state === "selected") {
        const templateKey = (parsed as { templateKey?: unknown }).templateKey;
        if (typeof templateKey === "string" && templateKey.length > 0) {
          return { state: "selected", templateKey };
        }
      }
    }
  } catch {
    if (value.length > 0) {
      return { state: "selected", templateKey: value };
    }
  }

  return null;
}

export function readGuildTemplateDraftState(guildId: string, scope = "guild") {
  if (!guildId) {
    return null;
  }

  const cacheKey = getDraftCacheKey(guildId, scope);
  if (draftCache.has(cacheKey)) {
    return draftCache.get(cacheKey) || null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedDraft = parseTemplateDraftRecord(window.localStorage.getItem(getGuildTemplateDraftKey(guildId, scope)));
    draftCache.set(cacheKey, storedDraft);
    return storedDraft;
  } catch {
    return null;
  }
}

export function readGuildTemplateDraft(guildId: string, scope = "guild") {
  const record = readGuildTemplateDraftState(guildId, scope);
  return record?.state === "selected" ? record.templateKey : "";
}

export function writeGuildTemplateDraftState(
  guildId: string,
  record: TemplateDraftRecord | null,
  scope = "guild",
) {
  if (!guildId) {
    return;
  }

  const cacheKey = getDraftCacheKey(guildId, scope);
  draftCache.set(cacheKey, record);

  if (typeof window === "undefined") {
    emitTemplateDraftChange();
    return;
  }

  try {
    if (record) {
      window.localStorage.setItem(getGuildTemplateDraftKey(guildId, scope), JSON.stringify(record));
    } else {
      window.localStorage.removeItem(getGuildTemplateDraftKey(guildId, scope));
    }

    emitTemplateDraftChange();
  } catch {
    // Ignore storage failures and keep the current in-memory state.
  }
}

export function writeGuildTemplateDraft(guildId: string, templateKey: string, scope = "guild") {
  writeGuildTemplateDraftState(
    guildId,
    templateKey ? { state: "selected", templateKey } : { state: "cleared" },
    scope,
  );
}

function getTemplateKeyFromState(record: TemplateDraftRecord | null, queryTemplateKey: string) {
  if (record?.state === "selected") {
    return record.templateKey;
  }

  if (record?.state === "cleared") {
    return "";
  }

  return queryTemplateKey;
}

export function useGuildTemplateDraft(guildId: string, queryTemplateKey: string, scope = "guild") {
  const [templateKey, setTemplateKeyState] = useState(() => {
    if (!guildId) {
      return queryTemplateKey;
    }

    return getTemplateKeyFromState(readGuildTemplateDraftState(guildId, scope), queryTemplateKey);
  });

  useEffect(() => {
    if (!guildId) {
      setTemplateKeyState(queryTemplateKey);
      return;
    }

    const storedDraft = readGuildTemplateDraftState(guildId, scope);
    const nextTemplateKey = getTemplateKeyFromState(storedDraft, queryTemplateKey);
    setTemplateKeyState(currentTemplateKey => (currentTemplateKey === nextTemplateKey ? currentTemplateKey : nextTemplateKey));

    if (storedDraft === null && queryTemplateKey) {
      writeGuildTemplateDraftState(guildId, { state: "selected", templateKey: queryTemplateKey }, scope);
    }
  }, [guildId, queryTemplateKey, scope]);

  useEffect(() => {
    if (!guildId) {
      return;
    }

    function handleDraftChange() {
      const nextTemplateKey = getTemplateKeyFromState(readGuildTemplateDraftState(guildId, scope), queryTemplateKey);
      setTemplateKeyState(currentTemplateKey => (currentTemplateKey === nextTemplateKey ? currentTemplateKey : nextTemplateKey));
    }

    return subscribe(handleDraftChange);
  }, [guildId, queryTemplateKey, scope]);

  function setTemplateKey(nextTemplateKey: string) {
    setTemplateKeyState(nextTemplateKey);
    writeGuildTemplateDraftState(
      guildId,
      nextTemplateKey ? { state: "selected", templateKey: nextTemplateKey } : { state: "cleared" },
      scope,
    );
  }

  function clearTemplateKey() {
    setTemplateKeyState("");
    writeGuildTemplateDraftState(guildId, { state: "cleared" }, scope);
  }

  return {
    templateKey,
    setTemplateKey,
    clearTemplateKey,
  };
}

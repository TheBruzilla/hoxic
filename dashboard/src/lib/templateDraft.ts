"use client";

import { useEffect, useState } from "react";

const TEMPLATE_DRAFT_EVENT = "hoxiq-template-draft-change";

type Listener = () => void;

const listeners = new Set<Listener>();
const draftCache = new Map<string, string>();

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

export function readGuildTemplateDraft(guildId: string, scope = "guild") {
  if (!guildId) {
    return "";
  }

  const cacheKey = getDraftCacheKey(guildId, scope);
  if (draftCache.has(cacheKey)) {
    return draftCache.get(cacheKey) || "";
  }

  if (typeof window === "undefined") {
    return "";
  }

  try {
    const storedTemplateKey = window.localStorage.getItem(getGuildTemplateDraftKey(guildId, scope)) || "";
    if (storedTemplateKey) {
      draftCache.set(cacheKey, storedTemplateKey);
    }
    return storedTemplateKey;
  } catch {
    return "";
  }
}

export function writeGuildTemplateDraft(guildId: string, templateKey: string, scope = "guild") {
  if (!guildId) {
    return;
  }

  const cacheKey = getDraftCacheKey(guildId, scope);

  if (templateKey) {
    draftCache.set(cacheKey, templateKey);
  } else {
    draftCache.delete(cacheKey);
  }

  if (typeof window === "undefined") {
    emitTemplateDraftChange();
    return;
  }

  try {
    if (templateKey) {
      window.localStorage.setItem(getGuildTemplateDraftKey(guildId, scope), templateKey);
    } else {
      window.localStorage.removeItem(getGuildTemplateDraftKey(guildId, scope));
    }

    emitTemplateDraftChange();
  } catch {
    // Ignore storage failures and keep the current in-memory state.
  }
}

export function useGuildTemplateDraft(guildId: string, queryTemplateKey: string, scope = "guild") {
  const [templateKey, setTemplateKeyState] = useState(() => {
    if (!guildId) {
      return queryTemplateKey;
    }

    return readGuildTemplateDraft(guildId, scope) || queryTemplateKey;
  });

  useEffect(() => {
    if (!guildId) {
      setTemplateKeyState(queryTemplateKey);
      return;
    }

    const storedTemplateKey = readGuildTemplateDraft(guildId, scope);
    const nextTemplateKey = storedTemplateKey || queryTemplateKey;
    setTemplateKeyState(currentTemplateKey => (currentTemplateKey === nextTemplateKey ? currentTemplateKey : nextTemplateKey));

    if (!storedTemplateKey && queryTemplateKey) {
      writeGuildTemplateDraft(guildId, queryTemplateKey, scope);
    }
  }, [guildId, queryTemplateKey, scope]);

  useEffect(() => {
    if (!guildId) {
      return;
    }

    function handleDraftChange() {
      const nextTemplateKey = readGuildTemplateDraft(guildId, scope) || queryTemplateKey;
      setTemplateKeyState(currentTemplateKey => (currentTemplateKey === nextTemplateKey ? currentTemplateKey : nextTemplateKey));
    }

    return subscribe(handleDraftChange);
  }, [guildId, queryTemplateKey, scope]);

  function setTemplateKey(nextTemplateKey: string) {
    setTemplateKeyState(nextTemplateKey);
    writeGuildTemplateDraft(guildId, nextTemplateKey, scope);
  }

  return {
    templateKey,
    setTemplateKey,
  };
}

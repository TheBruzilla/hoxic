"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuInfo, LuTriangleAlert, LuX } from "react-icons/lu";
import styles from "./console.module.scss";

type DashboardToastTone = "info" | "success" | "danger";

interface DashboardToast {
  id: string;
  title: string;
  description: string;
  tone: DashboardToastTone;
}

interface DashboardFeedbackContextValue {
  pushToast: (toast: Omit<DashboardToast, "id">) => void;
  dismissToast: (id: string) => void;
}

const DashboardFeedbackContext = createContext<DashboardFeedbackContextValue | null>(null);

function getToastIcon(tone: DashboardToastTone) {
  if (tone === "success") {
    return LuCheck;
  }
  if (tone === "danger") {
    return LuTriangleAlert;
  }
  return LuInfo;
}

export function DashboardFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<DashboardToast[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback((toast: Omit<DashboardToast, "id">) => {
    const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts(current => [...current.slice(-2), { ...toast, id }]);

    const timeout = window.setTimeout(() => {
      setToasts(current => current.filter(item => item.id !== id));
      timeoutsRef.current.delete(id);
    }, 4200);

    timeoutsRef.current.set(id, timeout);
  }, []);

  useEffect(() => {
    const activeTimeouts = timeoutsRef.current;
    return () => {
      for (const timeout of activeTimeouts.values()) {
        window.clearTimeout(timeout);
      }
      activeTimeouts.clear();
    };
  }, []);

  const value = useMemo<DashboardFeedbackContextValue>(
    () => ({
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast],
  );

  return (
    <DashboardFeedbackContext.Provider value={value}>
      {children}
      <div className={styles.toastStack} aria-live="polite" aria-atomic="true">
        {toasts.map(toast => {
          const Icon = getToastIcon(toast.tone);
          return (
            <article
              key={toast.id}
              className={`${styles.toastCard} ${
                toast.tone === "danger"
                  ? styles.toastDanger
                  : toast.tone === "success"
                    ? styles.toastSuccess
                    : styles.toastInfo
              }`}
            >
              <div className={styles.toastIconWrap}>
                <Icon />
              </div>
              <div className={styles.toastCopy}>
                <strong>{toast.title}</strong>
                <p>{toast.description}</p>
              </div>
              <button
                type="button"
                className={styles.toastDismiss}
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                <LuX />
              </button>
            </article>
          );
        })}
      </div>
    </DashboardFeedbackContext.Provider>
  );
}

export function useDashboardFeedback() {
  const context = useContext(DashboardFeedbackContext);
  if (!context) {
    throw new Error("useDashboardFeedback must be used within a DashboardFeedbackProvider");
  }
  return context;
}

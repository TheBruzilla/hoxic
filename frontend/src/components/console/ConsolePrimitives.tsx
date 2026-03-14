"use client";

import Link from "next/link";
import { ElementType, ReactNode } from "react";
import { LuActivity, LuBot, LuLogIn, LuShieldCheck } from "react-icons/lu";
import styles from "./console.module.scss";

export function GlassPanel({
  as: Component = "section",
  children,
  className = "",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return <Component className={`${styles.pageSurface} ${className}`.trim()}>{children}</Component>;
}

export function GlassCard({
  as: Component = "article",
  children,
  className = "",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return <Component className={`${styles.card} ${className}`.trim()}>{children}</Component>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  titleClassName,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <div className={styles.pageHeader}>
      <div>
        {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
        <h1 className={`${styles.pageTitle} ${titleClassName || ""}`.trim()}>{title}</h1>
        {description ? <p className={styles.pageText}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.cardActions}>{actions}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <article className={styles.card}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {meta ? <div className={styles.cardText}>{meta}</div> : null}
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const toneClass =
    status === "running" || status === "Live"
      ? styles.statusRunning
      : status === "starting" || status === "Preview" || status === "Beta"
        ? styles.statusStarting
        : styles.statusDanger;
  return <span className={`${styles.statusBadge} ${toneClass}`}>{status}</span>;
}

export function Badge({
  label,
  tone = "soft",
}: {
  label: string;
  tone?: "soft" | "beta" | "premium" | "new";
}) {
  const className =
    tone === "beta"
      ? styles.badgeBeta
      : tone === "premium"
        ? styles.badgePremium
        : tone === "new"
          ? styles.badgeNew
          : styles.badgeSoft;
  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p className={styles.pageText}>{description}</p>
      {action}
    </div>
  );
}

export function StickySaveBar({
  dirty,
  busy = false,
  saveLabel,
  idleLabel = "Unsaved changes",
  busyLabel = "Saving changes…",
  onReset,
}: {
  dirty: boolean;
  busy?: boolean;
  saveLabel: string;
  idleLabel?: string;
  busyLabel?: string;
  onReset?: () => void;
}) {
  if (!dirty) {
    return null;
  }

  return (
    <div className={styles.stickySaveBar}>
      <div className={styles.stickySaveCopy}>
        <strong>{busy ? busyLabel : idleLabel}</strong>
        <span>Review the current draft and apply it when you are ready.</span>
      </div>
      <div className={styles.cardActions}>
        {onReset ? (
          <button type="button" className={styles.buttonSecondary} onClick={onReset} disabled={busy}>
            Reset
          </button>
        ) : null}
        <button type="submit" className={styles.button} disabled={busy}>
          {busy ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

export function AuthGate() {
  return (
    <section className={styles.authGate}>
      <div className={styles.authGateHeader}>
        <div className={styles.authGateBadge}>
          <LuShieldCheck />
        </div>
        <div className={styles.authGateIntro}>
          <div className={styles.eyebrow}>Secure Sign-In</div>
          <h1 className={`${styles.pageTitle} ${styles.authGateTitle}`}>Sign in to HOXiq</h1>
          <p className={styles.pageText}>
            Use Discord to access provisioning, operators, and runtime controls.
          </p>
        </div>
      </div>

      <div className={styles.authGateMeta}>
        <span className={styles.chip}>Discord OAuth</span>
        <span className={styles.chip}>Secure access</span>
        <span className={styles.chip}>Bot console</span>
      </div>

      <div className={styles.authGateBody}>
        <div className={styles.authGateActionStack}>
          <Link href="/auth/login" className={styles.button}>
            <LuLogIn />
            Sign in with Discord
          </Link>
          <Link href="/" className={styles.buttonSecondary}>
            Back to landing page
          </Link>
        </div>

        <aside className={styles.authGateAside}>
          <div className={styles.authGateAsideTitle}>Inside</div>
          <div className={styles.authGateFeatureList}>
            <div className={styles.authGateFeature}>
              <LuBot />
              <span>Provision bots</span>
            </div>
            <div className={styles.authGateFeature}>
              <LuShieldCheck />
              <span>Manage operators and templates</span>
            </div>
            <div className={styles.authGateFeature}>
              <LuActivity />
              <span>Inspect runtime activity</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

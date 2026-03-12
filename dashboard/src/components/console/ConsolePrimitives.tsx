"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { LuActivity, LuBot, LuLogIn, LuShieldCheck } from "react-icons/lu";
import styles from "./console.module.scss";

export function SectionHeader({
  eyebrow,
  title,
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
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      {action}
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

"use client";

import { FormEvent, useState } from "react";
import { EmptyState, SectionHeader } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";
import { requestJson } from "@/lib/console";
import styles from "@/components/console/console.module.scss";

export default function OperatorsPage() {
  const { bootstrap, loading, error, refresh } = useConsole();
  const [userId, setUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <section className={styles.pageSurface}>
        <SectionHeader title="Loading operators" description="Pulling dashboard access and admin data." />
      </section>
    );
  }

  if (error || !bootstrap) {
    return (
      <section className={styles.pageSurface}>
        <EmptyState title="Operators unavailable" description={error || "No operator data is available."} />
      </section>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await requestJson("/api/admins/invite", {
        method: "POST",
        body: JSON.stringify({ userId: userId.trim() }),
      });
      setUserId("");
      setMessage("Discord user invited to the dashboard.");
      await refresh();
    } catch (inviteError) {
      setMessage(inviteError instanceof Error ? inviteError.message : "Failed to invite operator.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Operators"
          title="Manage who can touch the control plane"
          description="Keep access management on its own page so admin onboarding does not get lost inside bot settings."
        />
        <form className={styles.formGrid} onSubmit={onSubmit}>
          <div className={styles.formTwo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="operator-id">
                Discord user ID
              </label>
              <input
                id="operator-id"
                className={styles.input}
                value={userId}
                onChange={event => setUserId(event.target.value)}
                placeholder="294777245027926026"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Current owner</label>
              <div className={styles.callout}>
                {bootstrap.admins.find(admin => admin.role === "owner")?.globalName ||
                  bootstrap.admins.find(admin => admin.role === "owner")?.username ||
                  "Owner not detected"}
              </div>
            </div>
          </div>
          {message ? <div className={styles.callout}>{message}</div> : null}
          <div className={styles.cardActions}>
            <button type="submit" className={styles.button} disabled={submitting}>
              {submitting ? "Inviting…" : "Invite operator"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageSurface}>
        <SectionHeader
          eyebrow="Access List"
          title="Current dashboard admins"
          description="These are the Discord accounts that can reach the control plane."
        />
        {bootstrap.admins.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>Invited by</th>
                  <th>Created</th>
                  <th>Last login</th>
                </tr>
              </thead>
              <tbody>
                {bootstrap.admins.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.globalName || admin.username}</strong>
                      <div className={styles.muted}>{admin.id}</div>
                    </td>
                    <td>{admin.role}</td>
                    <td>{admin.invitedBy || "owner / bootstrap"}</td>
                    <td>{new Date(admin.createdAt).toLocaleString()}</td>
                    <td>{new Date(admin.lastLoginAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No operators found" description="Invite an admin using the form above." />
        )}
      </section>
    </>
  );
}

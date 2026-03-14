import Link from "next/link";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default async function MainDormantStatePage({
  params,
}: {
  params: Promise<{ serverId: string; templateKey: string }>;
}) {
  const { serverId, templateKey } = await params;

  if (!isCanonicalTemplateKey(templateKey)) {
    return (
      <GlassPanel>
        <EmptyState title="Unknown template" description={`Template '${templateKey}' is not canonical.`} />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Dormant State"
        title="Main bot is dormant"
        description="Unprovisioned state returns this server to overview flow until template provisioning is re-applied."
      />
      <div className={styles.callout}>
        Dormant transition complete. Invite presence is retained but module runtime is intentionally inactive.
      </div>
      <div className={styles.cardActions}>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}`} className={styles.button}>
          Return to Overview Hub
        </Link>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}/main/templates`} className={styles.buttonSecondary}>
          Choose Template Again
        </Link>
      </div>
    </GlassPanel>
  );
}

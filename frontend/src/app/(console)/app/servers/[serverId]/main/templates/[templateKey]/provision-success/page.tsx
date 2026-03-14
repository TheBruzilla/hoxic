import Link from "next/link";
import { EmptyState, GlassPanel, SectionHeader } from "@/components/console/ConsolePrimitives";
import { getCanonicalTemplate, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";
import styles from "@/components/console/console.module.scss";

export default async function MainProvisionSuccessPage({
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

  const template = getCanonicalTemplate(templateKey);
  if (!template) {
    return (
      <GlassPanel>
        <EmptyState title="Template unavailable" description="Could not load selected template." />
      </GlassPanel>
    );
  }

  const workspaceHref = `/app/servers/${encodeURIComponent(serverId)}/main/workspace?template=${encodeURIComponent(template.key)}`;

  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Provision Success"
        title={`${template.name} is now active for main workspace`}
        description="Workspace remains template-scoped and module pages are rendered as controlled placeholders."
      />
      <div className={styles.cardActions}>
        <Link href={workspaceHref} className={styles.button}>Open Main Workspace</Link>
        <Link href={`/app/servers/${encodeURIComponent(serverId)}`} className={styles.buttonSecondary}>
          Back to Overview Hub
        </Link>
      </div>
    </GlassPanel>
  );
}

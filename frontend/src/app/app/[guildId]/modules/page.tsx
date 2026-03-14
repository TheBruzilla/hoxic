import { Suspense } from "react";
import { ModulesCenterScreen } from "@/components/console/ModulesCenterScreen";

export const dynamic = "force-dynamic";

export default async function GuildModulesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  return (
    <Suspense fallback={null}>
      <ModulesCenterScreen forcedGuildId={guildId} />
    </Suspense>
  );
}

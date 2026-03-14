import { redirect } from "next/navigation";

export default async function LegacyGuildModulesCompatPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  redirect(`/app/servers/${encodeURIComponent(guildId)}/main/workspace`);
}

import { redirect } from "next/navigation";

export default async function LegacySetupCompatPage({
  searchParams,
}: {
  searchParams: Promise<{ guild?: string }>;
}) {
  const params = await searchParams;
  const guildId = typeof params.guild === "string" ? params.guild : "";

  if (guildId) {
    redirect(`/app/servers/${encodeURIComponent(guildId)}`);
  }

  redirect("/app/servers");
}

import { redirect } from "next/navigation";

export default async function LegacyFocusedSetupCompatPage({
  searchParams,
}: {
  searchParams: Promise<{ guild?: string; slot?: string }>;
}) {
  const params = await searchParams;
  const guildId = typeof params.guild === "string" ? params.guild : "";
  const rawSlot = typeof params.slot === "string" ? Number.parseInt(params.slot, 10) : null;

  if (guildId) {
    if (Number.isInteger(rawSlot) && rawSlot !== null && rawSlot >= 0 && rawSlot <= 3) {
      redirect(`/app/servers/${encodeURIComponent(guildId)}/focused/${rawSlot + 1}/link`);
    }
    redirect(`/app/servers/${encodeURIComponent(guildId)}/focused`);
  }

  redirect("/app/servers");
}

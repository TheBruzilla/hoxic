import { redirect } from "next/navigation";

export default async function LegacyProvisionCompatPage({
  searchParams,
}: {
  searchParams: Promise<{ guild?: string; template?: string; slot?: string }>;
}) {
  const params = await searchParams;
  const guildId = typeof params.guild === "string" ? params.guild : "";
  const templateKey = typeof params.template === "string" ? params.template : "";
  const rawSlot = typeof params.slot === "string" ? Number.parseInt(params.slot, 10) : null;
  const hasLegacySlot = Number.isInteger(rawSlot) && rawSlot !== null && rawSlot >= 0 && rawSlot <= 3;

  if (guildId && templateKey) {
    if (hasLegacySlot) {
      redirect(
        `/app/servers/${encodeURIComponent(guildId)}/focused/${rawSlot + 1}/provision?template=${encodeURIComponent(templateKey)}`,
      );
    }
    redirect(`/app/servers/${encodeURIComponent(guildId)}/main/templates/${encodeURIComponent(templateKey)}`);
  }

  if (guildId) {
    redirect(`/app/servers/${encodeURIComponent(guildId)}`);
  }

  redirect("/app/servers");
}

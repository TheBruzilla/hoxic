import type { BotRecord, ManageableGuildRecord } from "@/lib/console";

export const DISCORD_DEVELOPER_PORTAL_URL = "https://discord.com/developers/applications";

export function getAccessLabel(isOwner: boolean) {
  return isOwner ? "Owner" : "Administrator";
}

export function buildSetupHref(guildId: string, templateKey?: string) {
  const params = new URLSearchParams();
  if (guildId) params.set("guild", guildId);
  if (templateKey) params.set("template", templateKey);
  return `/app/setup?${params.toString()}`;
}

export function buildFocusedBotsHref(guildId: string, templateKey?: string, slotIndex?: number | null) {
  const params = new URLSearchParams();
  if (guildId) params.set("guild", guildId);
  if (templateKey) params.set("template", templateKey);
  if (typeof slotIndex === "number") params.set("slot", String(slotIndex));
  return `/app/setup/focused?${params.toString()}`;
}

export function buildTemplateSelectorHref(returnTo: string, templateKey?: string) {
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  if (templateKey) params.set("template", templateKey);
  return `/app/bots?${params.toString()}`;
}

export function buildProvisionHref(guildId: string, templateKey: string, slotIndex?: number | null) {
  const params = new URLSearchParams();
  if (guildId) params.set("guild", guildId);
  if (templateKey) params.set("template", templateKey);
  if (typeof slotIndex === "number") params.set("slot", String(slotIndex));
  return `/app/provision?${params.toString()}`;
}

export function getProvisioningLabel(guild: ManageableGuildRecord) {
  const provisioning = getGuildProvisioning(guild);
  if (provisioning.mode === "primary") return "Full Suite";
  if (provisioning.mode === "secondary") return "Focused Bots";
  if (provisioning.mode === "invalid") return "Needs cleanup";
  return "Unassigned";
}

export function getFocusedSlotLabel(guild: ManageableGuildRecord) {
  const provisioning = getGuildProvisioning(guild);
  const used = 4 - provisioning.remainingFocusedSlots;
  return `${used}/4 linked`;
}

export function getTransitionLockMessage(guild: ManageableGuildRecord) {
  const provisioning = getGuildProvisioning(guild);
  if (provisioning.blockedReason === "remove_secondary_bots_first") {
    return "Please remove focused bots to enable Full Suite.";
  }
  if (provisioning.blockedReason === "full_suite_already_installed") {
    return "Full Suite is already installed. Focused slots are locked.";
  }
  if (provisioning.blockedReason === "invalid_existing_state") {
    return "This guild has an invalid provisioning state and needs cleanup before changes are allowed.";
  }
  return null;
}

export function getGuildProvisioning(guild: ManageableGuildRecord) {
  if (guild.provisioning) {
    return guild.provisioning;
  }

  return {
    mode: guild.primaryBotId ? "primary" : guild.botIds.length > 0 ? "secondary" : "none",
    blockedReason: guild.primaryBotId ? "full_suite_already_installed" : guild.botIds.length > 0 ? "remove_secondary_bots_first" : null,
    primaryBotId: guild.primaryBotId || null,
    secondaryBotIds: guild.primaryBotId ? guild.botIds.filter(id => id !== guild.primaryBotId) : guild.botIds,
    remainingFocusedSlots: guild.primaryBotId ? 0 : Math.max(0, 4 - guild.botIds.length),
  };
}

export function findPrimaryBot(bots: BotRecord[], guild: ManageableGuildRecord) {
  const provisioning = getGuildProvisioning(guild);
  if (provisioning.primaryBotId) {
    return bots.find(bot => bot.id === provisioning.primaryBotId) || null;
  }
  if (guild.primaryBotId) {
    return bots.find(bot => bot.id === guild.primaryBotId) || null;
  }
  return bots.find(bot => bot.role === "primary") || null;
}

export function findSecondaryBots(bots: BotRecord[], guild: ManageableGuildRecord) {
  const provisioning = getGuildProvisioning(guild);
  const ids = provisioning.secondaryBotIds;
  const mapped = ids
    .map(id => bots.find(bot => bot.id === id) || null)
    .filter((bot): bot is BotRecord => Boolean(bot));
  if (mapped.length > 0) {
    return mapped;
  }
  return bots.filter(bot => bot.role === "secondary" && guild.botIds.includes(bot.id));
}

import { BotRecord, BootstrapPayload, ManageableGuildRecord } from "@/lib/console";
import { getCanonicalTemplate, isCanonicalTemplateKey } from "@/lib/catalog/template-catalog";

export function findServerRecord(
  bootstrap: BootstrapPayload | null,
  serverId: string,
): ManageableGuildRecord | null {
  if (!bootstrap || !serverId) {
    return null;
  }

  return bootstrap.manageableGuilds.find(guild => guild.id === serverId) || null;
}

export function findMainBotForServer(
  bootstrap: BootstrapPayload | null,
  server: ManageableGuildRecord | null,
): BotRecord | null {
  if (!bootstrap || !server) {
    return null;
  }

  const provisioningPrimaryId = server.provisioning?.primaryBotId || server.primaryBotId;
  if (provisioningPrimaryId) {
    return bootstrap.bots.find(bot => bot.id === provisioningPrimaryId) || null;
  }

  if (server.botIds.length > 0) {
    const mapped = server.botIds
      .map(botId => bootstrap.bots.find(bot => bot.id === botId) || null)
      .find(bot => bot?.role === "primary");
    if (mapped) {
      return mapped;
    }
  }

  return null;
}

export function findFocusedBotsForServer(
  bootstrap: BootstrapPayload | null,
  server: ManageableGuildRecord | null,
): BotRecord[] {
  if (!bootstrap || !server) {
    return [];
  }

  const secondaryIds = server.provisioning?.secondaryBotIds || [];
  const mappedSecondary = secondaryIds
    .map(botId => bootstrap.bots.find(bot => bot.id === botId) || null)
    .filter((bot): bot is BotRecord => Boolean(bot));

  if (mappedSecondary.length > 0) {
    return mappedSecondary;
  }

  return bootstrap.bots.filter(bot => bot.role === "secondary" && server.botIds.includes(bot.id));
}

export function parseFocusedSlot(value: string): number | null {
  const slot = Number.parseInt(value, 10);
  if (!Number.isInteger(slot) || slot < 1 || slot > 4) {
    return null;
  }

  return slot;
}

export function slotToIndex(slot: number) {
  return slot - 1;
}

export function coerceTemplateKey(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return isCanonicalTemplateKey(value) ? value : "";
}

export function formatServerAccessLabel(server: ManageableGuildRecord | null) {
  if (!server) {
    return "Unknown access";
  }

  return server.isOwner ? "Owner" : "Administrator";
}

export function summarizeProvisioningMode(server: ManageableGuildRecord | null) {
  if (!server) {
    return "Unknown";
  }

  if (server.provisioning.mode === "primary") {
    return "Main bot active";
  }
  if (server.provisioning.mode === "secondary") {
    return "Focused bots active";
  }
  if (server.provisioning.mode === "invalid") {
    return "Invalid state";
  }
  return "Unprovisioned";
}

export function getTemplateDescription(templateKey: string) {
  return getCanonicalTemplate(templateKey)?.description || "Template description unavailable.";
}

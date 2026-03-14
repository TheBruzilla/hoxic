import type { IconType } from "react-icons";
import {
  LuActivity,
  LuBell,
  LuBot,
  LuBrainCircuit,
  LuBoxes,
  LuChartColumn,
  LuCircleDollarSign,
  LuCog,
  LuHeadset,
  LuMessageSquareText,
  LuRadio,
  LuShield,
  LuSparkles,
  LuTicket,
  LuUsers,
  LuWandSparkles,
} from "react-icons/lu";
import type { ModuleId } from "@/lib/console";

export type ModuleCategory =
  | "Core"
  | "Moderation"
  | "Automation"
  | "Messaging"
  | "Support"
  | "Growth"
  | "Broadcast"
  | "Premium";

export interface ModuleSurfaceMetadata {
  category: ModuleCategory;
  description: string;
  outcome: string;
  icon: IconType;
  preview?: boolean;
  premium?: boolean;
  runtimeLinked?: boolean;
}

const moduleSurfaceCatalog: Record<ModuleId, ModuleSurfaceMetadata> = {
  moderation: {
    category: "Moderation",
    description: "Warnings, timeouts, and operator defaults for day-to-day moderation.",
    outcome: "Keep basic moderator actions predictable across every guild.",
    icon: LuShield,
  },
  automod: {
    category: "Moderation",
    description: "Rule-based enforcement for spam, invites, caps, and raid-like behavior.",
    outcome: "Catch obvious abuse before staff need to step in.",
    icon: LuShield,
  },
  autorole: {
    category: "Automation",
    description: "Assign starter roles automatically when members join or verify.",
    outcome: "Reduce manual role management during onboarding.",
    icon: LuSparkles,
  },
  roleCommands: {
    category: "Automation",
    description: "Let members trigger self-service role changes from controlled commands.",
    outcome: "Cut moderator overhead for common role toggles.",
    icon: LuUsers,
  },
  reputation: {
    category: "Growth",
    description: "Track member reputation and lightweight trust signals.",
    outcome: "Give staff and members visible progression signals.",
    icon: LuActivity,
  },
  logs: {
    category: "Moderation",
    description: "Route moderation and member events into the right audit channels.",
    outcome: "Keep accountability visible without digging through Discord.",
    icon: LuActivity,
    runtimeLinked: true,
  },
  notifications: {
    category: "Messaging",
    description: "Join, leave, and boost announcements with per-guild routing.",
    outcome: "Make server changes feel intentional and well-signposted.",
    icon: LuBell,
  },
  onboarding: {
    category: "Messaging",
    description: "Welcome routing, greeting copy, and first-touch member messaging.",
    outcome: "Turn a join into a guided first-run experience.",
    icon: LuMessageSquareText,
  },
  verification: {
    category: "Moderation",
    description: "Verification panels and gating flows for new members.",
    outcome: "Protect the server before full access is granted.",
    icon: LuShield,
  },
  reactionRoles: {
    category: "Growth",
    description: "Self-serve role panels for onboarding, pings, and team selection.",
    outcome: "Let members configure themselves without moderator intervention.",
    icon: LuWandSparkles,
  },
  tickets: {
    category: "Support",
    description: "Support intake panels, channels, and basic ticket routing.",
    outcome: "Give members a clear path to ask for help.",
    icon: LuTicket,
  },
  modmail: {
    category: "Support",
    description: "Private staff conversations and member contact workflows.",
    outcome: "Handle sensitive support without forcing public channels.",
    icon: LuHeadset,
  },
  ai: {
    category: "Premium",
    description: "Provider-backed AI persona and assistant routing for this bot.",
    outcome: "Turn the bot into an assistant instead of just a utility panel.",
    icon: LuBrainCircuit,
    premium: true,
  },
  reminders: {
    category: "Automation",
    description: "Scheduled reminders powered by the worker runtime.",
    outcome: "Keep recurring events and follow-ups from slipping through.",
    icon: LuBell,
    runtimeLinked: true,
  },
  rss: {
    category: "Broadcast",
    description: "Feed RSS sources into Discord with bot-managed delivery.",
    outcome: "Keep communities updated from outside content streams.",
    icon: LuRadio,
    runtimeLinked: true,
  },
  webhooks: {
    category: "Broadcast",
    description: "Generic and provider-specific webhook entry points for automation.",
    outcome: "Connect external systems into Discord with less glue code.",
    icon: LuRadio,
  },
  componentsV2: {
    category: "Messaging",
    description: "Managed message templates, layouts, and components-based sends.",
    outcome: "Ship polished Discord message surfaces without ad-hoc JSON editing.",
    icon: LuWandSparkles,
  },
  musicVoice: {
    category: "Premium",
    description: "Voice-driven music and shared session controls.",
    outcome: "Bring entertainment tools into the same control plane.",
    icon: LuBot,
    preview: true,
    premium: true,
  },
  voiceRoles: {
    category: "Automation",
    description: "Assign roles based on voice presence and channel behavior.",
    outcome: "Reward participation without manual cleanup.",
    icon: LuUsers,
    preview: true,
  },
  serverStats: {
    category: "Growth",
    description: "Expose server metrics through bot-managed channels and counters.",
    outcome: "Make server momentum visible at a glance.",
    icon: LuChartColumn,
    runtimeLinked: true,
  },
  feeds: {
    category: "Broadcast",
    description: "Unified feed delivery for content subscriptions and alert sources.",
    outcome: "Manage updates from one place instead of scattered webhooks.",
    icon: LuRadio,
    runtimeLinked: true,
  },
  reddit: {
    category: "Broadcast",
    description: "Track subreddit activity and relay it into Discord channels.",
    outcome: "Keep niche communities plugged into external signals.",
    icon: LuRadio,
    runtimeLinked: true,
  },
  twitch: {
    category: "Broadcast",
    description: "Announce live streams and Twitch activity from selected creators.",
    outcome: "Turn Discord into the first place your community sees live updates.",
    icon: LuRadio,
    runtimeLinked: true,
  },
  youtube: {
    category: "Broadcast",
    description: "Watch uploads and stream activity for YouTube creators.",
    outcome: "Promote new content without manual posting.",
    icon: LuRadio,
    runtimeLinked: true,
  },
  streaming: {
    category: "Broadcast",
    description: "Handle broader stream-presence updates across supported platforms.",
    outcome: "Keep the alert stack consistent even as channels grow.",
    icon: LuRadio,
    runtimeLinked: true,
  },
  rsvp: {
    category: "Growth",
    description: "Event posts with RSVP tracking and close-out workflows.",
    outcome: "Coordinate launches, sessions, and community events with less friction.",
    icon: LuActivity,
  },
  soundboard: {
    category: "Premium",
    description: "Reusable sound clips and voice-room interaction tools.",
    outcome: "Add lightweight fun without leaving the dashboard.",
    icon: LuSparkles,
    premium: true,
    preview: true,
  },
  customCommands: {
    category: "Automation",
    description: "Structured command responses and reusable staff shortcuts.",
    outcome: "Give your team repeatable answers without memorizing syntax.",
    icon: LuBoxes,
  },
  premium: {
    category: "Premium",
    description: "Billing, codes, entitlements, and unlock-aware workspace upgrades.",
    outcome: "Make premium state visible instead of hidden in checkout flows.",
    icon: LuCircleDollarSign,
    premium: true,
  },
  personalizer: {
    category: "Premium",
    description: "Per-guild bot identity, nickname, avatar, and presentation controls.",
    outcome: "Let the bot feel purpose-built for each server.",
    icon: LuSparkles,
    premium: true,
  },
  utilities: {
    category: "Core",
    description: "Common module controls and shared utility toggles.",
    outcome: "Keep generic bot controls in one predictable place.",
    icon: LuCog,
  },
};

export const moduleCategories: ModuleCategory[] = [
  "Core",
  "Moderation",
  "Automation",
  "Messaging",
  "Support",
  "Growth",
  "Broadcast",
  "Premium",
];

export function getModuleSurfaceMetadata(moduleId: ModuleId, fallbackLabel: string): ModuleSurfaceMetadata {
  return moduleSurfaceCatalog[moduleId] ?? {
    category: "Core",
    description: `${fallbackLabel} can be managed from the dashboard.`,
    outcome: `Use ${fallbackLabel} without relying on slash commands or hidden config.`,
    icon: LuBoxes,
  };
}

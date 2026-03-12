"use client";

import { useParams } from "next/navigation";
import { BotWorkspaceScreen } from "@/components/console/BotWorkspaceScreen";

export default function BotWorkspaceOverviewPage() {
  const params = useParams<{ botId: string }>();
  const botId = String(params?.botId || "");

  return <BotWorkspaceScreen botId={botId} section="overview" />;
}

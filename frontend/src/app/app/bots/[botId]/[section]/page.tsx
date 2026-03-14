import { notFound } from "next/navigation";
import { BotWorkspaceScreen } from "@/components/console/BotWorkspaceScreen";
import { isBotWorkspaceSection } from "@/lib/console";

export default async function BotWorkspaceSectionPage({
  params,
}: {
  params: Promise<{ botId: string; section: string }>;
}) {
  const { botId, section } = await params;

  if (!isBotWorkspaceSection(section) || section === "overview") {
    notFound();
  }

  return <BotWorkspaceScreen botId={botId} section={section} />;
}

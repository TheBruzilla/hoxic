import { ConsoleFlowShell } from "@/features/shells/ConsoleFlowShell";

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  return <ConsoleFlowShell serverId={serverId}>{children}</ConsoleFlowShell>;
}

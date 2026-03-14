"use client";

import { useParams } from "next/navigation";
import { parseFocusedSlot } from "@/features/flow/server-flow";
import { WorkspaceShell } from "@/features/shells/WorkspaceShell";

export default function FocusedWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ serverId: string; slot: string }>();
  const serverId = String(params?.serverId || "");
  const slot = parseFocusedSlot(String(params?.slot || ""));

  return (
    <WorkspaceShell serverId={serverId} scope="focused" slot={slot || undefined}>
      {children}
    </WorkspaceShell>
  );
}

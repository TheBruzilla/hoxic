"use client";

import { useParams } from "next/navigation";
import { WorkspaceShell } from "@/features/shells/WorkspaceShell";

export default function MainWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ serverId: string }>();
  const serverId = String(params?.serverId || "");

  return (
    <WorkspaceShell serverId={serverId} scope="main">
      {children}
    </WorkspaceShell>
  );
}

import { ConsoleFlowShell } from "@/features/shells/ConsoleFlowShell";

export default function ServersLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleFlowShell>{children}</ConsoleFlowShell>;
}

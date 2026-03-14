import { Suspense } from "react";
import { ConsoleProvider } from "@/components/console/ConsoleProvider";
import { DashboardFeedbackProvider } from "@/components/console/DashboardFeedback";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { GuildContextProvider } from "@/components/console/GuildContext";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleProvider>
      <DashboardFeedbackProvider>
        <Suspense fallback={null}>
          <GuildContextProvider>
            <ConsoleShell>{children}</ConsoleShell>
          </GuildContextProvider>
        </Suspense>
      </DashboardFeedbackProvider>
    </ConsoleProvider>
  );
}

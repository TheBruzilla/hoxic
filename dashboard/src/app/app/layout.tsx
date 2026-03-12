import { Suspense } from "react";
import { ConsoleProvider } from "@/components/console/ConsoleProvider";
import { ConsoleShell } from "@/components/console/ConsoleShell";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleProvider>
      <Suspense fallback={null}>
        <ConsoleShell>{children}</ConsoleShell>
      </Suspense>
    </ConsoleProvider>
  );
}

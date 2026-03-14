import { ConsoleProvider } from "@/components/console/ConsoleProvider";
import { ConsoleAuthBoundary } from "@/features/flow/ConsoleAuthBoundary";

export const dynamic = "force-dynamic";

export default function ConsoleAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleProvider>
      <ConsoleAuthBoundary>{children}</ConsoleAuthBoundary>
    </ConsoleProvider>
  );
}

"use client";

import { EmptyState, GlassPanel, SectionHeader, AuthGate } from "@/components/console/ConsolePrimitives";
import { useConsole } from "@/components/console/ConsoleProvider";

export function ConsoleAuthBoundary({ children }: { children: React.ReactNode }) {
  const { loading, bootstrap, error, unauthorized } = useConsole();

  if (unauthorized) {
    return <AuthGate />;
  }

  if (loading && !bootstrap) {
    return (
      <GlassPanel>
        <SectionHeader
          eyebrow="Console"
          title="Loading controlled dashboard flow"
          description="Validating session and bootstrap payload."
        />
      </GlassPanel>
    );
  }

  if (error && !bootstrap) {
    return (
      <GlassPanel>
        <EmptyState title="Console unavailable" description={error} />
      </GlassPanel>
    );
  }

  return <>{children}</>;
}

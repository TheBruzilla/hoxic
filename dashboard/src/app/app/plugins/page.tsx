import { Suspense } from "react";
import PluginsPageClient from "./PluginsPageClient";

export const dynamic = "force-dynamic";

export default function PluginsPage() {
  return (
    <Suspense fallback={null}>
      <PluginsPageClient />
    </Suspense>
  );
}

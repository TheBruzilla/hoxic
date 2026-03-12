import { Suspense } from "react";
import BotsPageClient from "./BotsPageClient";

export const dynamic = "force-dynamic";

export default function BotsPage() {
  return (
    <Suspense fallback={null}>
      <BotsPageClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import FocusedBotsPageClient from "./FocusedBotsPageClient";

export const dynamic = "force-dynamic";

export default function FocusedBotsPage() {
  return (
    <Suspense fallback={null}>
      <FocusedBotsPageClient />
    </Suspense>
  );
}

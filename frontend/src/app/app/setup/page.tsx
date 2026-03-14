import { Suspense } from "react";
import SetupPageClient from "./SetupPageClient";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageClient />
    </Suspense>
  );
}

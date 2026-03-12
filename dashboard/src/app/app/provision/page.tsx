import { Suspense } from "react";
import ProvisionPageClient from "./ProvisionPageClient";

export const dynamic = "force-dynamic";

export default function ProvisionPage() {
  return (
    <Suspense fallback={null}>
      <ProvisionPageClient />
    </Suspense>
  );
}

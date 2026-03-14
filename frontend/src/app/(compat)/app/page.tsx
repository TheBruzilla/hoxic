import { redirect } from "next/navigation";

export default function LegacyAppRootCompatPage() {
  redirect("/app/servers");
}

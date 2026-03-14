import { redirect } from "next/navigation";

export default function LegacyBotsCompatPage() {
  redirect("/app/servers");
}

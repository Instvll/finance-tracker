import { redirect } from "next/navigation";

export default function BackupSettingsRedirect() {
  redirect("/account/profile#advanced-sync");
}
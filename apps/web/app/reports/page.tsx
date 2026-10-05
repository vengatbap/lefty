import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  if (!await getCurrentUser()) redirect("/login");
  return <ReportsClient />;
}
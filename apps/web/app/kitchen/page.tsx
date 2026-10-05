import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { KitchenClient } from "./kitchen-client";

export default async function KitchenPage() {
  if (!await getCurrentUser()) redirect("/login");
  return <KitchenClient />;
}

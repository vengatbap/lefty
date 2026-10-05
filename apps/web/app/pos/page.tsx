import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { POSClient } from "./pos-client";

export default async function POSPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <POSClient />;
}

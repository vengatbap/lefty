import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MenuClient } from "./menu-client";

export default async function MenuPage() {
  if (!await getCurrentUser()) redirect("/login");
  return <MenuClient />;
}

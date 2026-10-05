import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  if (!await getCurrentUser()) redirect("/login");
  return <OrdersClient />;
}
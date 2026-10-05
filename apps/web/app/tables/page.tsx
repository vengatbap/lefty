import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TablesClient } from "./tables-client";
export default async function TablesPage(){if(!await getCurrentUser())redirect("/login");return <TablesClient/>}
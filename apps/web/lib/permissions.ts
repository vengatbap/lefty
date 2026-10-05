export type AppRole = "owner"|"admin"|"manager"|"incharge"|"supervisor"|"cashier"|"employee";
const permissions = {
  "menu.read": ["owner","admin","manager","incharge","supervisor","cashier","employee"],
  "menu.manage": ["owner","admin","manager","incharge"],
  "inventory.adjust": ["owner","admin","manager","incharge"],
  "orders.create": ["owner","admin","manager","incharge","supervisor","cashier"],
  "orders.update": ["owner","admin","manager","incharge","supervisor","cashier"],
  "tables.manage": ["owner","admin","manager","incharge"],
  "customers.manage": ["owner","admin","manager","incharge","supervisor","cashier"],
  "reports.read": ["owner","admin","manager","incharge"],
} as const;
export function can(role: string, permission: keyof typeof permissions) {
  return (permissions[permission] as readonly string[]).includes(role);
}
export function requirePermission(role: string, permission: keyof typeof permissions) {
  if (!can(role, permission)) throw new Error("FORBIDDEN");
}
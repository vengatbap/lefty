import { redirect } from "next/navigation";
import { db, locations, menuItems } from "@lefty/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const outlets = await db.select().from(locations).where(eq(locations.organizationId, user.organizationId));
  const items = outlets[0] ? await db.select().from(menuItems).where(eq(menuItems.locationId, outlets[0].id)) : [];

  return <main className="app-page">
    <header className="topbar"><div><div className="logo">LEFTY</div><span className="muted">{outlets[0]?.name ?? "No outlet"}</span></div><div className="top-actions"><span>{user.name} · {user.role}</span><LogoutButton /></div></header>
    <section className="dashboard">
      <div className="hero"><div><p className="eyebrow">RESTAURANT OPERATIONS</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p className="muted">Your production workspace is connected to the server.</p></div><a className="primary link-button" href="/pos">Open POS</a></div>
      <div className="cards"><div className="metric"><span>Menu items</span><strong>{items.length}</strong><small>Configured at this outlet</small></div><div className="metric"><span>Available</span><strong>{items.filter(i => i.active && (!i.trackAvailability || i.quantity > 0)).length}</strong><small>Orderable now</small></div><div className="metric"><span>Low stock</span><strong>{items.filter(i => i.trackAvailability && i.quantity > 0 && i.quantity <= 3).length}</strong><small>3 or fewer remaining</small></div></div>
      <section className="panel"><div className="panel-head"><div><h2>Menu availability</h2><p className="muted">Server-backed item quantity used by POS.</p></div></div>{items.length === 0 ? <p className="empty">No menu items yet. POS setup will populate this area.</p> : <div className="menu-list">{items.map(item => <div className="menu-row" key={item.id}><div><strong>{item.name}</strong><span>{item.trackAvailability ? `${item.quantity} available` : "Availability not tracked"}</span></div><b>{Number(item.price).toFixed(3)} {outlets[0]?.currency}</b></div>)}</div>}</section>
    </section>
  </main>;
}

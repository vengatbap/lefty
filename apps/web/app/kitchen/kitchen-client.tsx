"use client";

import { useEffect, useState } from "react";

type Order = { id:string; number:string; status:"new"|"accepted"|"preparing"|"ready"|"completed"|"cancelled"; total:string };
type Item = { id:string; menuItemId:string; quantity:number; unitPrice:string; total:string };
type Ticket = { order:Order; items:Item[] };

const next: Record<string,string> = { new:"accepted", accepted:"preparing", preparing:"ready", ready:"completed" };

export function KitchenClient() {
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [error,setError]=useState("");

  async function load() {
    const response=await fetch("/api/orders",{cache:"no-store"});
    const data=await response.json();
    if(response.ok) setTickets(data.orders ?? []);
    else setError(data.error ?? "Unable to load kitchen queue.");
  }
  useEffect(()=>{load(); const id=setInterval(load,5000); return ()=>clearInterval(id);},[]);

  async function advance(ticket:Ticket) {
    const response=await fetch(`/api/orders/${ticket.order.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next[ticket.order.status]})});
    if(!response.ok){const data=await response.json();setError(data.error ?? "Unable to update order.");return;}
    load();
  }

  return <main className="app-page"><header className="topbar"><div className="logo">LEFTY · KITCHEN</div><div className="top-actions"><span className="muted">Live queue · refreshes every 5 seconds</span><a className="secondary link-button" href="/dashboard">Dashboard</a></div></header>
    <section className="dashboard"><div className="hero"><div><p className="eyebrow">KITCHEN DISPLAY</p><h1>Work the next ticket.</h1><p className="muted">Every state change is validated and recorded on the server.</p></div></div>{error&&<p className="error">{error}</p>}
      <div className="kds-grid">{["new","accepted","preparing","ready"].map(status=><section className="kds-column" key={status}><div className="kds-heading"><h2>{status}</h2><b>{tickets.filter(t=>t.order.status===status).length}</b></div>{tickets.filter(t=>t.order.status===status).map(ticket=><article className="ticket" key={ticket.order.id}><div className="ticket-top"><strong>{ticket.order.number}</strong><span>{Number(ticket.order.total).toFixed(3)}</span></div>{ticket.items.map(item=><div className="ticket-item" key={item.id}><b>{item.quantity}×</b><span>Item {item.menuItemId.slice(0,8)}</span></div>)}<button className="primary" onClick={()=>advance(ticket)}>{status==="new"?"Accept":status==="accepted"?"Start preparing":status==="preparing"?"Mark ready":"Complete"}</button></article>)}</section>)}</div>
    </section>
  </main>;
}

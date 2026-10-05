"use client";

import { FormEvent, useEffect, useState } from "react";

type Item = { id: string; name: string; price: string; quantity: number; lowStockThreshold: number; trackAvailability: boolean; active: boolean };

export function MenuClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/menu");
    const data = await response.json();
    setItems(data.items ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, price: Number(data.price), quantity: Number(data.quantity), lowStockThreshold: Number(data.lowStockThreshold) }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "Unable to add item."); return; }
    event.currentTarget.reset(); setMessage("Menu item added."); load();
  }

  async function adjust(id: string, delta: number) {
    const response = await fetch(`/api/menu/${id}/availability`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ delta }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Unable to adjust stock."); return; }
    setItems(prev => prev.map(item => item.id === id ? data.item : item));
  }

  return <main className="app-page"><header className="topbar"><div className="logo">LEFTY · MENU</div><div className="top-actions"><a className="secondary link-button" href="/dashboard">Dashboard</a><a className="primary link-button" href="/pos">POS</a></div></header>
    <section className="dashboard">
      <div className="hero"><div><p className="eyebrow">MENU & AVAILABILITY</p><h1>Keep every item orderable.</h1><p className="muted">Set price, quantity and low-stock thresholds. POS enforces availability on the server.</p></div></div>
      <section className="panel"><div className="panel-head"><div><h2>Add menu item</h2><p className="muted">Start with the items your restaurant actually sells.</p></div></div>
        <form className="menu-form" onSubmit={create}><input name="name" placeholder="Item name" required /><input name="price" type="number" min="0.001" step="0.001" placeholder="Price" required /><input name="quantity" type="number" min="0" step="1" defaultValue="0" placeholder="Quantity" required /><input name="lowStockThreshold" type="number" min="0" step="1" defaultValue="3" placeholder="Low-stock at" required /><button className="primary">Add item</button></form>
        {message && <p className="success">{message}</p>}
      </section>
      <section className="panel" style={{marginTop:16}}><div className="panel-head"><div><h2>Items</h2><p className="muted">{items.length} configured</p></div></div>
        <div className="menu-list">{items.map(item => <div className="menu-row" key={item.id}><div><strong>{item.name}</strong><span>{Number(item.price).toFixed(3)} · {item.trackAvailability ? `${item.quantity} available · low at ${item.lowStockThreshold}` : "availability not tracked"}</span></div><div className="stock-actions"><button className="secondary" onClick={() => adjust(item.id,-1)} disabled={item.quantity <= 0}>−</button><b>{item.quantity}</b><button className="secondary" onClick={() => adjust(item.id,1)}>+</button></div></div>)}</div>
      </section>
    </section>
  </main>;
}

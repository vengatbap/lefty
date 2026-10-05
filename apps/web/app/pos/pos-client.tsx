"use client";

import { useEffect, useState } from "react";

type Item = { id: string; name: string; price: string; quantity: number; trackAvailability: boolean; category?: string | null };
type CartLine = Item & { count: number };

export function POSClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/menu").then(r => r.json()).then(d => setItems(d.items ?? [])); }, []);

  function add(item: Item) {
    if (item.trackAvailability && item.quantity <= (cart.find(x => x.id === item.id)?.count ?? 0)) return;
    setCart(prev => prev.some(x => x.id === item.id) ? prev.map(x => x.id === item.id ? { ...x, count: x.count + 1 } : x) : [...prev, { ...item, count: 1 }]);
  }
  async function submit() {
    setMessage("");
    const idempotencyKey = crypto.randomUUID();
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ type: "takeaway", paymentMethod: "cash", idempotencyKey, items: cart.map(x => ({ menuItemId: x.id, quantity: x.count })) }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Unable to create order."); return; }
    setCart([]); setMessage(`Order ${data.order.number} created.`);
    setItems(prev => prev.map(i => { const line = cart.find(x => x.id === i.id); return line && i.trackAvailability ? { ...i, quantity: i.quantity - line.count } : i; }));
  }

  const total = cart.reduce((sum, x) => sum + Number(x.price) * x.count, 0);
  return <main className="app-page"><header className="topbar"><div className="logo">LEFTY · POS</div><a className="secondary link-button" href="/dashboard">Dashboard</a></header><section className="pos-page"><div><p className="eyebrow">NEW ORDER</p><h1>Takeaway</h1><div className="products">{items.map(item => <button key={item.id} className="product" disabled={!item.active || (item.trackAvailability && item.quantity <= 0)} onClick={() => add(item)}><strong>{item.name}</strong><span>{Number(item.price).toFixed(3)}</span><small>{item.trackAvailability ? `${item.quantity} left` : "Available"}</small></button>)}</div></div><aside className="cart"><h2>Current order</h2>{cart.map(line => <div className="cart-line" key={line.id}><span>{line.count} × {line.name}</span><b>{(Number(line.price) * line.count).toFixed(3)}</b></div>)}<div className="cart-total"><span>Total</span><strong>{total.toFixed(3)}</strong></div>{message && <p className={message.startsWith("Order") ? "success" : "error"}>{message}</p>}<button className="primary" disabled={!cart.length} onClick={submit}>Take cash & send to kitchen</button></aside></section></main>;
}

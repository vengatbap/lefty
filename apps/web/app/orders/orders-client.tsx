"use client";
import { useEffect, useState } from "react";
type Order={id:string;number:string;type:string;status:string;total:string;createdAt:string};
export function OrdersClient(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [error,setError]=useState("");
 async function load(){const r=await fetch("/api/orders/history");const d=await r.json();if(!r.ok){setError(d.error??"Unable to load orders.");return;}setOrders(d.orders??[]);}
 useEffect(()=>{load()},[]);
 return <main className="app-page"><header className="topbar"><div><div className="logo">LEFTY · ORDERS</div><span className="muted">Order management</span></div><div className="top-actions"><a className="secondary link-button" href="/dashboard">Dashboard</a><a className="primary link-button" href="/pos">New order</a></div></header><section className="dashboard"><div className="hero"><div><p className="eyebrow">ORDER MANAGEMENT</p><h1>Recent orders</h1><p className="muted">Review the latest order lifecycle and totals.</p></div></div>{error&&<p className="error">{error}</p>}<section className="panel"><div className="menu-list">{orders.map(o=><div className="menu-row" key={o.id}><div><strong>{o.number}</strong><span>{o.type.replace("_"," ")} · {o.status} · {new Date(o.createdAt).toLocaleString()}</span></div><b>{Number(o.total).toFixed(3)}</b></div>)}{!orders.length&&<p className="empty">No orders yet.</p>}</div></section></section></main>;
}
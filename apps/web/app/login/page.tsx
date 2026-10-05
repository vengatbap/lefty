"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Unable to sign in.");
    else router.push("/dashboard");
    setBusy(false);
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <div className="brand-mark">l</div><p className="eyebrow">LEFTY</p><h1>Welcome back.</h1><p className="muted">Run your restaurant from one operational workspace.</p>
    <label>Email<input name="email" type="email" required autoComplete="email" /></label>
    <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
    {error && <p className="error">{error}</p>}<button disabled={busy} className="primary">{busy ? "Signing in…" : "Sign in"}</button>
    <p className="muted center">New restaurant? <a href="/signup">Create your workspace</a></p>
  </form></main>;
}

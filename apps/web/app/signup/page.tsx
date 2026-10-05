"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Unable to create workspace.");
    else router.push("/dashboard");
    setBusy(false);
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <div className="brand-mark">l</div><p className="eyebrow">LEFTY</p><h1>Start your restaurant.</h1><p className="muted">Create the owner workspace and your first outlet.</p>
    <label>Restaurant name<input name="restaurantName" required /></label>
    <label>Your name<input name="name" required autoComplete="name" /></label>
    <label>Email<input name="email" type="email" required autoComplete="email" /></label>
    <label>Password<input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
    {error && <p className="error">{error}</p>}<button disabled={busy} className="primary">{busy ? "Creating…" : "Create workspace"}</button>
    <p className="muted center">Already have an account? <a href="/login">Sign in</a></p>
  </form></main>;
}

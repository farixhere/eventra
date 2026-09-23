"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in");

      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/dashboard") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <div className="adminLoginGlow adminLoginGlowOne" />
      <div className="adminLoginGlow adminLoginGlowTwo" />

      <section className="adminLoginShell">
        <div className="adminLoginBrand">
          <a href="/" className="adminLoginLogo">eventra<span>.</span></a>
          <span className="adminLoginBadge">CONTROL CENTER</span>
        </div>

        <div className="adminLoginCard">
          <div className="adminLoginIcon">e</div>
          <div className="adminLoginEyebrow">ORGANISER ACCESS</div>
          <h1>Welcome back.</h1>
          <p className="adminLoginIntro">
            Sign in to manage events, programmes, participants and published results.
          </p>

          {error && <div className="adminLoginError">{error}</div>}

          <form onSubmit={submit}>
            <label className="adminLoginField">
              <span>Admin password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                autoFocus
              />
            </label>

            <button className="adminLoginButton" type="submit" disabled={saving}>
              {saving ? "Checking access…" : "Enter Control Center"}
              {!saving && <span>↗</span>}
            </button>
          </form>

          <div className="adminLoginFoot">
            <span><i /> Private organiser area</span>
            <a href="/">Back to website</a>
          </div>
        </div>

        <p className="adminLoginCopyright">EVENTRA · EVENT MANAGEMENT</p>
      </section>
    </main>
  );
}

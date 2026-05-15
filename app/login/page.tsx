"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  async function login() {
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login error: " + error.message);
      return;
    }

    setMessage("Login successful. Redirecting...");

    window.location.href = "/dashboard";
  }

  async function logout() {
    await supabase.auth.signOut();
    setMessage("Logged out.");
  }

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in to CJ Joinery Workflow.</p>

      {message && <div className="status-box">{message}</div>}

      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Email & Password Login</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            value={email}
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="button" onClick={login}>
            Login
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}

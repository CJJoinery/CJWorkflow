"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [sites, setSites] = useState(0);
  const [tasks, setTasks] = useState(0);
  const [pending, setPending] = useState(0);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    setMessage("Loading...");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setMessage("Not logged in");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    setRole(profile?.role || "");

    const { count: siteCount } = await supabase
      .from("sites")
      .select("*", { count: "exact", head: true });

    const { count: taskCount } = await supabase
      .from("programme_tasks")
      .select("*", { count: "exact", head: true });

    const { count: pendingCount } = await supabase
      .from("suggested_edits")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setSites(siteCount || 0);
    setTasks(taskCount || 0);
    setPending(pendingCount || 0);
    setMessage("Dashboard loaded");
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const canManage = role === "owner" || role === "manager";

  return (
    <main>
      <h1>Dashboard</h1>

      <div className="status-box">Status: {message}</div>

      <div className="grid">
        <div className="stat">
          <span>Jobs / Sites</span>
          <strong>{sites}</strong>
        </div>

        <div className="stat">
          <span>Booked Tasks</span>
          <strong>{tasks}</strong>
        </div>

        <div className="stat">
          <span>Change Requests</span>
          <strong>{pending}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Your Role</h2>
        <p style={{ fontWeight: "bold" }}>{role || "Not loaded"}</p>
      </div>

      <div className="card">
        <h2>Work Planner</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/programme">
            <button>Table View</button>
          </a>

          <a href="/programme-visual">
            <button>Visual Board</button>
          </a>

          <a href="/programme-gantt">
            <button>Gantt Planner</button>
          </a>

          <a href="/programme-print">
            <button>Printable Planner</button>
          </a>
        </div>
      </div>

      <div className="card">
        <h2>Actions</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {canManage && (
            <a href="/site-admin">
              <button>Admin</button>
            </a>
          )}

          <a href="/programme">
            <button>Open Work Planner</button>
          </a>

          {canManage && (
            <a href="/approvals">
              <button>Approve Change Requests</button>
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type SuggestedEdit = {
  id: string;
  task_id: string;
  current_start_date: string | null;
  current_end_date: string | null;
  suggested_start_date: string | null;
  suggested_end_date: string | null;
  reason: string | null;
  status: string | null;
  programme_tasks: {
    plot_number: string | null;
    task_name: string | null;
    trade: string | null;
  } | null;
};

export default function Approvals() {
  const [role, setRole] = useState("");
  const [edits, setEdits] = useState<SuggestedEdit[]>([]);
  const [message, setMessage] = useState("");

  async function loadRole() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setMessage("Not logged in. Please login first.");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    setRole(data?.role || "");
  }

  async function loadEdits() {
    setMessage("Loading change requests...");

    const { data, error } = await supabase
      .from("suggested_edits")
      .select(
        `id, task_id, current_start_date, current_end_date, suggested_start_date, suggested_end_date, reason, status, programme_tasks ( plot_number, task_name, trade )`
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Load error: " + error.message);
      return;
    }

    setEdits((data as unknown as SuggestedEdit[]) || []);
    setMessage("Change requests loaded");
  }

  async function approveEdit(edit: SuggestedEdit) {
    if (role !== "owner" && role !== "manager") {
      setMessage("Only owners and managers can approve changes.");
      return;
    }

    setMessage("Approving change...");

    const { error: taskError } = await supabase
      .from("programme_tasks")
      .update({
        start_date: edit.suggested_start_date,
        end_date: edit.suggested_end_date,
        status: "Planned",
      })
      .eq("id", edit.task_id);

    if (taskError) {
      setMessage("Planner update error: " + taskError.message);
      return;
    }

    const { error: editError } = await supabase
      .from("suggested_edits")
      .update({ status: "approved" })
      .eq("id", edit.id);

    if (editError) {
      setMessage("Request update error: " + editError.message);
      return;
    }

    setMessage("Change approved");
    loadEdits();
  }

  async function rejectEdit(editId: string) {
    if (role !== "owner" && role !== "manager") {
      setMessage("Only owners and managers can reject changes.");
      return;
    }

    setMessage("Rejecting change...");

    const { error } = await supabase
      .from("suggested_edits")
      .update({ status: "rejected" })
      .eq("id", editId);

    if (error) {
      setMessage("Reject error: " + error.message);
      return;
    }

    setMessage("Change rejected");
    loadEdits();
  }

  useEffect(() => {
    loadRole();
    loadEdits();
  }, []);

  const canApprove = role === "owner" || role === "manager";

  return (
    <main>
      <h1>Change Requests</h1>

      <div className="status-box">
        Status: {message}
        <br />
        Role: {role || "Loading..."}
      </div>

      {!canApprove && (
        <div className="card">
          <h2>Restricted Access</h2>
          <p>Staff can suggest changes, but only owners and managers can approve them.</p>
        </div>
      )}

      {edits.length === 0 && (
        <div className="card">
          <p>No pending change requests.</p>
        </div>
      )}

      {edits.map((edit) => (
        <div key={edit.id} className="card">
          <h2>
            {edit.programme_tasks?.plot_number} - {edit.programme_tasks?.task_name}
          </h2>

          <p>Work Type: {edit.programme_tasks?.trade}</p>
          <p>
            Current: {edit.current_start_date} → {edit.current_end_date}
          </p>
          <p>
            Suggested: {edit.suggested_start_date} → {edit.suggested_end_date}
          </p>
          <p>Reason: {edit.reason}</p>

          {canApprove && (
            <>
              <button
                className="success-button"
                onClick={() => approveEdit(edit)}
                style={{ marginRight: 10 }}
              >
                Approve
              </button>

              <button
                className="danger-button"
                onClick={() => rejectEdit(edit.id)}
              >
                Reject
              </button>
            </>
          )}
        </div>
      ))}
    </main>
  );
}

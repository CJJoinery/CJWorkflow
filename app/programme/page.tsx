"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Site = {
  id: string;
  site_name: string;
};

type WorkType = {
  id: string;
  trade_name: string;
  colour: string;
};

type Staff = {
  id: string;
  role: string;
  trade: string | null;
};

type Task = {
  id: string;
  site_id: string;
  plot_number: string | null;
  task_name: string;
  trade: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  assigned_staff: string | null;
  notes: string | null;
  work_address: string | null;
};

export default function ProgrammePage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [siteId, setSiteId] = useState("");
  const [jobRef, setJobRef] = useState("");
  const [taskName, setTaskName] = useState("");
  const [workType, setWorkType] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Booked");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: siteData } = await supabase
      .from("sites")
      .select("id, site_name")
      .order("site_name");

    const { data: workTypeData } = await supabase
      .from("trades")
      .select("id, trade_name, colour")
      .order("trade_name");

    const { data: staffData } = await supabase
      .from("profiles")
      .select("id, role, trade")
      .order("role");

    const { data: taskData } = await supabase
      .from("programme_tasks")
      .select("*")
      .order("start_date", { ascending: true });

    setSites(siteData || []);
    setWorkTypes(workTypeData || []);
    setStaff(staffData || []);
    setTasks(taskData || []);

    if (!siteId && siteData && siteData.length > 0) {
      setSiteId(siteData[0].id);
    }
  }

  async function addTask() {
    setMessage("");

    if (!siteId || !taskName || !startDate || !endDate) {
      setMessage("Please complete job/site, task name, start date and end date.");
      return;
    }

    const { error } = await supabase.from("programme_tasks").insert({
      site_id: siteId,
      plot_number: jobRef,
      task_name: taskName,
      trade: workType,
      assigned_staff: assignedStaff || null,
      work_address: workAddress,
      start_date: startDate,
      end_date: endDate,
      status,
      notes,
    });

    if (error) {
      setMessage("Error adding work: " + error.message);
      return;
    }

    setJobRef("");
    setTaskName("");
    setWorkType("");
    setAssignedStaff("");
    setWorkAddress("");
    setStartDate("");
    setEndDate("");
    setStatus("Booked");
    setNotes("");

    setMessage("Work booked successfully.");
    loadData();
  }

  async function deleteTask(id: string) {
    const confirmed = confirm("Delete this booked work?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("programme_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage("Delete error: " + error.message);
      return;
    }

    setMessage("Booked work deleted.");
    loadData();
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("programme_tasks")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setMessage("Status error: " + error.message);
      return;
    }

    setMessage("Status updated.");
    loadData();
  }

  function staffName(id: string | null) {
    if (!id) return "-";
    const member = staff.find((s) => s.id === id);
    return member ? `${member.role} - ${member.trade || "Joinery"}` : id;
  }

  return (
    <main>
      <h1>Book Work</h1>
      <p>Book joinery tasks directly to staff members.</p>

      {message && <div className="status-box">{message}</div>}

      <div className="card">
        <h2>Add Booked Work</h2>

        <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Select Job / Site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.site_name}
              </option>
            ))}
          </select>

          <input
            value={jobRef}
            onChange={(e) => setJobRef(e.target.value)}
            placeholder="Job ref / plot / address short name"
          />

          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Task name, e.g. Fit internal doors"
          />

          <select value={workType} onChange={(e) => setWorkType(e.target.value)}>
            <option value="">Select Work Type</option>
            {workTypes.map((type) => (
              <option key={type.id} value={type.trade_name}>
                {type.trade_name}
              </option>
            ))}
          </select>

          <select
            value={assignedStaff}
            onChange={(e) => setAssignedStaff(e.target.value)}
          >
            <option value="">Assign Staff</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.role} - {member.trade || "Joinery"}
              </option>
            ))}
          </select>

          <input
            value={workAddress}
            onChange={(e) => setWorkAddress(e.target.value)}
            placeholder="Work address"
          />

          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Booked">Booked</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
            <option value="Snagging">Snagging</option>
            <option value="On Hold">On Hold</option>
          </select>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={4}
          />

          <button onClick={addTask}>Book Work</button>
        </div>
      </div>

      <div className="card">
        <h2>Booked Work</h2>

        <table>
          <thead>
            <tr>
              <th>Job Ref</th>
              <th>Task</th>
              <th>Work Type</th>
              <th>Staff</th>
              <th>Dates</th>
              <th>Status</th>
              <th className="no-print">Action</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.plot_number || "-"}</td>
                <td>
                  <strong>{task.task_name}</strong>
                  <br />
                  <small>{task.work_address}</small>
                </td>
                <td>{task.trade || "-"}</td>
                <td>{staffName(task.assigned_staff)}</td>
                <td>
                  {task.start_date} → {task.end_date}
                </td>
                <td>
                  <select
                    value={task.status || "Booked"}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                  >
                    <option value="Booked">Booked</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Complete">Complete</option>
                    <option value="Snagging">Snagging</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </td>
                <td className="no-print">
                  <button
                    className="danger-button"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={7}>No work booked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

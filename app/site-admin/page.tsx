"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Site = {
  id: string;
  site_name: string;
  developer: string | null;
  status: string | null;
};

type WorkType = {
  id: string;
  site_id: string;
  trade_name: string;
  colour: string;
};

type StaffMember = {
  id: string;
  role: string;
  trade: string | null;
};

export default function SiteAdminPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [siteName, setSiteName] = useState("");
  const [developer, setDeveloper] = useState("CJ Joinery");
  const [status, setStatus] = useState("active");

  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [workTypeName, setWorkTypeName] = useState("");
  const [workTypeColour, setWorkTypeColour] = useState("#78212e");

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const { data: siteData } = await supabase
      .from("sites")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: workTypeData } = await supabase
      .from("trades")
      .select("*")
      .order("trade_name", { ascending: true });

    const { data: staffData } = await supabase
      .from("profiles")
      .select("*");

    setSites(siteData || []);
    setWorkTypes(workTypeData || []);
    setStaff(staffData || []);

    if (!selectedSiteId && siteData && siteData.length > 0) {
      setSelectedSiteId(siteData[0].id);
    }
  }

  async function addSite() {
    setMessage("");

    if (!siteName.trim()) {
      setMessage("Please enter a job or site name.");
      return;
    }

    const { error } = await supabase.from("sites").insert({
      site_name: siteName.trim(),
      developer: developer.trim(),
      status,
    });

    if (error) {
      setMessage(`Site error: ${error.message}`);
      return;
    }

    setSiteName("");
    setDeveloper("CJ Joinery");
    setStatus("active");
    setMessage("Job/site added.");
    loadAdminData();
  }

  async function deleteSite(id: string) {
    const confirmed = confirm(
      "Delete this job/site? This may also delete linked tasks."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("sites").delete().eq("id", id);

    if (error) {
      setMessage(`Delete error: ${error.message}`);
      return;
    }

    setMessage("Job/site deleted.");
    loadAdminData();
  }

  async function addWorkType() {
    setMessage("");

    if (!selectedSiteId) {
      setMessage("Please select a job/site first.");
      return;
    }

    if (!workTypeName.trim()) {
      setMessage("Please enter a work type name.");
      return;
    }

    const { error } = await supabase.from("trades").insert({
      site_id: selectedSiteId,
      trade_name: workTypeName.trim(),
      colour: workTypeColour,
    });

    if (error) {
      setMessage(`Work type error: ${error.message}`);
      return;
    }

    setWorkTypeName("");
    setWorkTypeColour("#78212e");
    setMessage("Work type added.");
    loadAdminData();
  }

  async function deleteWorkType(id: string) {
    const confirmed = confirm("Delete this work type?");
    if (!confirmed) return;

    const { error } = await supabase.from("trades").delete().eq("id", id);

    if (error) {
      setMessage(`Delete error: ${error.message}`);
      return;
    }

    setMessage("Work type deleted.");
    loadAdminData();
  }

  async function updateStaffRole(id: string, role: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      setMessage(`Role update error: ${error.message}`);
      return;
    }

    setMessage("Staff role updated.");
    loadAdminData();
  }

  return (
    <main>
      <h1>Admin</h1>
      <p>
        Manage jobs/sites, work types and staff access for the CJ Joinery work
        planner.
      </p>

      {message && <div className="status-box">{message}</div>}

      <div className="grid">
        <div className="stat">
          <strong>{sites.length}</strong>
          Jobs / Sites
        </div>
        <div className="stat">
          <strong>{workTypes.length}</strong>
          Work Types
        </div>
        <div className="stat">
          <strong>{staff.length}</strong>
          Staff Users
        </div>
      </div>

      <div className="card">
        <h2>Add Job / Site</h2>

        <div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Example: Plot 12 - Oakwood Gardens"
          />

          <input
            value={developer}
            onChange={(e) => setDeveloper(e.target.value)}
            placeholder="Customer / Builder / Developer"
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="complete">Complete</option>
          </select>

          <button onClick={addSite}>Add Job / Site</button>
        </div>
      </div>

      <div className="card">
        <h2>Current Jobs / Sites</h2>

        <table>
          <thead>
            <tr>
              <th>Job / Site</th>
              <th>Customer / Developer</th>
              <th>Status</th>
              <th className="no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id}>
                <td>{site.site_name}</td>
                <td>{site.developer || "-"}</td>
                <td>
                  <span className="badge">{site.status || "active"}</span>
                </td>
                <td className="no-print">
                  <button
                    className="danger-button"
                    onClick={() => deleteSite(site.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {sites.length === 0 && (
              <tr>
                <td colSpan={4}>No jobs/sites added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Add Work Type</h2>
        <p>
          Examples: 1st Fix Joinery, 2nd Fix Joinery, Doors, Skirting,
          Kitchens, Finals, Snagging.
        </p>

        <div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            <option value="">Select job/site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.site_name}
              </option>
            ))}
          </select>

          <input
            value={workTypeName}
            onChange={(e) => setWorkTypeName(e.target.value)}
            placeholder="Work type name"
          />

          <input
            type="color"
            value={workTypeColour}
            onChange={(e) => setWorkTypeColour(e.target.value)}
          />

          <button onClick={addWorkType}>Add Work Type</button>
        </div>
      </div>

      <div className="card">
        <h2>Work Types</h2>

        <table>
          <thead>
            <tr>
              <th>Work Type</th>
              <th>Colour</th>
              <th>Linked Job/Site</th>
              <th className="no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            {workTypes.map((type) => {
              const linkedSite = sites.find((s) => s.id === type.site_id);

              return (
                <tr key={type.id}>
                  <td>{type.trade_name}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        background: type.colour,
                        border: "1px solid #ddd",
                      }}
                    />
                  </td>
                  <td>{linkedSite?.site_name || "-"}</td>
                  <td className="no-print">
                    <button
                      className="danger-button"
                      onClick={() => deleteWorkType(type.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {workTypes.length === 0 && (
              <tr>
                <td colSpan={4}>No work types added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Staff Permissions</h2>
        <p>
          Use Owner or Manager for Cory/admin users. Use Staff for joiners who
          only need to view or update their work.
        </p>

        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Current Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>
                  <span className="badge">{member.role}</span>
                </td>
                <td>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateStaffRole(member.id, e.target.value)
                    }
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </td>
              </tr>
            ))}

            {staff.length === 0 && (
              <tr>
                <td colSpan={3}>
                  No staff profiles found yet. They will appear here once they
                  sign up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

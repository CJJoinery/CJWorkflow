"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Staff = {
  id: string;
  full_name: string | null;
  role: string;
};

type Task = {
  id: string;
  plot_number: string | null;
  task_name: string;
  trade: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  assigned_staff: string | null;
  work_address: string | null;
};

const DAY_WIDTH = 76;
const STAFF_COL_WIDTH = 230;
const HEADER_HEIGHT = 108;
const ROW_HEIGHT = 92;
const BAR_TOP_OFFSET = 24;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function daysBetween(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);

  return Math.max(
    1,
    Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function taskColour(type: string | null) {
  const value = (type || "").toLowerCase();

  if (value.includes("kitchen")) return "#8b1230";
  if (value.includes("door")) return "#005cc8";
  if (value.includes("1st")) return "#f28c00";
  if (value.includes("skirting")) return "#078f8f";
  if (value.includes("snag")) return "#62a83f";
  if (value.includes("final")) return "#8f3fb8";

  return "#78212e";
}

export default function ProgrammeGanttPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [rangeDays, setRangeDays] = useState(21);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setMessage("Loading planner...");

    const { data: staffData } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });

    const { data: taskData, error } = await supabase
      .from("programme_tasks")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      setMessage("Planner error: " + error.message);
      return;
    }

    setStaff(staffData || []);
    setTasks(taskData || []);
    setMessage("");
  }

  const dates = useMemo(() => {
    const base = new Date(startDate);
    return Array.from({ length: rangeDays }, (_, i) => addDays(base, i));
  }, [startDate, rangeDays]);

  function previous() {
    setStartDate(formatDateInput(addDays(new Date(startDate), -7)));
  }

  function next() {
    setStartDate(formatDateInput(addDays(new Date(startDate), 7)));
  }

  function today() {
    setStartDate(formatDateInput(new Date()));
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

    loadData();
  }

  async function updateTaskDates(task: Task, newStartDate: string) {
    if (!task.start_date || !task.end_date) return;

    const duration = daysBetween(task.start_date, task.end_date);
    const newEndDate = formatDateInput(
      addDays(new Date(newStartDate), duration - 1)
    );

    const { error } = await supabase
      .from("programme_tasks")
      .update({
        start_date: newStartDate,
        end_date: newEndDate,
      })
      .eq("id", task.id);

    if (error) {
      setMessage("Move error: " + error.message);
      return;
    }

    loadData();
  }

  const unassignedTasks = tasks.filter((task) => !task.assigned_staff);

  return (
    <main>
      <div className="planner-topbar">
        <div>
          <h1>Programme Planner</h1>
          <p>Staff work planner for CJ Joinery.</p>
        </div>

        <div className="planner-actions">
          <a href="/programme">
            <button>+ Task</button>
          </a>

          <button className="secondary-button" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {message && <div className="status-box">{message}</div>}

      <div className="planner-card">
        <div className="planner-tabs">
          <button className="planner-tab">Daily View</button>
          <button className="planner-tab">Weekly View</button>
          <button className="planner-tab active">Overview</button>
        </div>

        <div className="planner-title-row">
          <div>
            <h2>Overview Planner</h2>
            <p>
              {dates[0].toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}{" "}
              -{" "}
              {dates[dates.length - 1].toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="planner-toolbar">
            <button className="secondary-button" onClick={previous}>
              ‹ Previous
            </button>

            <button className="secondary-button" onClick={today}>
              Today
            </button>

            <button className="secondary-button" onClick={next}>
              Next ›
            </button>

            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
            >
              <option value={14}>2 Weeks</option>
              <option value={21}>3 Weeks</option>
              <option value={35}>5 Weeks</option>
            </select>
          </div>
        </div>

        <div className="staff-gantt-wrap">
          <div
            className="staff-gantt"
            style={{
              gridTemplateColumns: `${STAFF_COL_WIDTH}px repeat(${rangeDays}, ${DAY_WIDTH}px)`,
            }}
          >
            <div className="staff-header-cell">Staff Member</div>

            {dates.map((date) => {
              const isToday =
                formatDateInput(date) === formatDateInput(new Date());

              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={date.toISOString()}
                  className={`date-header-cell ${isToday ? "today" : ""} ${
                    isWeekend ? "weekend" : ""
                  }`}
                >
                  <strong>
                    {date.toLocaleDateString("en-GB", { weekday: "short" })}
                  </strong>

                  <span>{date.getDate()}</span>

                  <small>
                    {date.toLocaleDateString("en-GB", { month: "short" })}
                  </small>

                  <em />
                </div>
              );
            })}

            {staff.map((member, staffIndex) => {
              const staffName = member.full_name || member.role || "Staff";

              const memberTasks = tasks.filter(
                (task) => task.assigned_staff === member.id
              );

              return (
                <div key={member.id} className="staff-row">
                  <div className="staff-name-cell">
                    <span className="avatar">{initials(staffName)}</span>
                    <strong>{staffName}</strong>
                  </div>

                  {dates.map((date) => {
                    const dateString = formatDateInput(date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = dateString === formatDateInput(new Date());

                    return (
                      <div
                        key={`${member.id}-${dateString}`}
                        className={`planner-day-cell ${
                          isWeekend ? "weekend" : ""
                        } ${isToday ? "today-line" : ""}`}
                      />
                    );
                  })}

                  {memberTasks.map((task) => {
                    if (!task.start_date || !task.end_date) return null;

                    const startIndex = dates.findIndex(
                      (d) => formatDateInput(d) === task.start_date
                    );

                    if (startIndex < 0) return null;

                    const duration = daysBetween(task.start_date, task.end_date);

                    const width = Math.max(duration * DAY_WIDTH - 12, 70);

                    const left = STAFF_COL_WIDTH + startIndex * DAY_WIDTH + 6;

                    const top =
                      HEADER_HEIGHT + staffIndex * ROW_HEIGHT + BAR_TOP_OFFSET;

                    return (
                      <div
                        key={task.id}
                        className="staff-task-bar"
                        draggable
                        onDragEnd={(e) => {
                          const grid = e.currentTarget.parentElement;

                          if (!grid) return;

                          const rect = grid.getBoundingClientRect();

                          const x = e.clientX - rect.left - STAFF_COL_WIDTH;

                          const dayIndex = Math.max(
                            0,
                            Math.min(rangeDays - 1, Math.floor(x / DAY_WIDTH))
                          );

                          updateTaskDates(task, formatDateInput(dates[dayIndex]));
                        }}
                        style={{
                          left,
                          top,
                          width,
                          background: taskColour(task.trade),
                        }}
                        title={`${task.plot_number || ""} ${task.task_name}`}
                      >
                        <span>
                          {task.plot_number ? `${task.plot_number} - ` : ""}
                          {task.task_name}
                        </span>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div className="unassigned-label">
              <strong>Unassigned Line Items ({unassignedTasks.length})</strong>
              <span>Click to assign to staff</span>
            </div>

            <div
              className="unassigned-row"
              style={{ gridColumn: `2 / span ${rangeDays}` }}
            />
          </div>
        </div>
      </div>

      <div className="planner-legend">
        <span>
          <b style={{ background: "#8b1230" }} />
          Kitchens
        </span>
        <span>
          <b style={{ background: "#005cc8" }} />
          Doors
        </span>
        <span>
          <b style={{ background: "#f28c00" }} />
          1st Fix
        </span>
        <span>
          <b style={{ background: "#078f8f" }} />
          Skirting
        </span>
        <span>
          <b style={{ background: "#62a83f" }} />
          Snagging
        </span>
        <span>
          <b style={{ background: "#8f3fb8" }} />
          Finals
        </span>
      </div>
    </main>
  );
}

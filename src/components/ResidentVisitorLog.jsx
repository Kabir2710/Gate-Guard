import React, { useState } from "react";
import { useAppContext } from "../AppContext";

export default function ResidentVisitorLog() {
  const { entries, currentUser } = useAppContext();
  const [dateFilter, setDateFilter] = useState("");

  const myEntries = entries.filter((e) => e.houseId === currentUser?.houseId);

  const filteredLogs = myEntries.filter((log) => {
    if (!dateFilter) return true;
    const logDate = new Date(log.entryTime).toISOString().split("T")[0];
    return logDate.startsWith(dateFilter); // Allows 'YYYY-MM' matching for month or full date
  });

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
        <h2>My Visitor History</h2>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="date"
          className="form-input"
          style={{ width: "200px" }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <span
          style={{
            marginLeft: "1rem",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          * Filter by date to see past records. Guard details are automatically
          recorded.
        </span>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem 0" }}>Time</th>
            <th style={{ padding: "1rem 0" }}>Guest Details</th>
            <th style={{ padding: "1rem 0" }}>Guard Assigned</th>
            <th style={{ padding: "1rem 0" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr
              key={log.id}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td style={{ padding: "1rem 0", fontSize: "0.875rem" }}>
                {new Date(log.entryTime).toLocaleString()}
              </td>
              <td style={{ padding: "1rem 0" }}>
                <div style={{ fontWeight: 500 }}>{log.guestName}</div>
                <div
                  style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
                >
                  {log.purpose} • {log.mobile}
                </div>
              </td>
              <td style={{ padding: "1rem 0", color: "var(--text-muted)" }}>
                Guard Rakesh
              </td>{" "}
              {/* Dummy since Guard ID isn't directly bound in initial data yet */}
              <td style={{ padding: "1rem 0" }}>
                <span className={`badge badge-${log.status.toLowerCase()}`}>
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
          {filteredLogs.length === 0 && (
            <tr>
              <td
                colSpan="4"
                style={{ padding: "1rem 0", textAlign: "center" }}
              >
                No logs found for selected date.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

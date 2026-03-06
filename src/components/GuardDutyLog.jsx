import React from "react";
import { useAppContext } from "../AppContext";
import { useExtensionContext } from "../ExtensionContext";

export default function GuardDutyLog() {
  const { entries, currentUser } = useAppContext();
  const { deletedLogs, softDeleteLog } = useExtensionContext();

  // Filter out any logs the guard has softly deleted
  const visibleLogs = entries.filter(
    (log) =>
      !deletedLogs.includes(log.id) &&
      log.societyCode === currentUser?.societyCode,
  );

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <h2>My Duty Logs</h2>
      <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
        Review your processed entry logs. You can remove logs from this view
        without affecting the master records.
      </p>

      <table
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem 0" }}>Time</th>
            <th style={{ padding: "1rem 0" }}>Guest Details</th>
            <th style={{ padding: "1rem 0" }}>House</th>
            <th style={{ padding: "1rem 0" }}>Status</th>
            <th style={{ padding: "1rem 0", textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {visibleLogs.map((log) => (
            <tr
              key={log.id}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td style={{ padding: "1rem 0", fontSize: "0.875rem" }}>
                {new Date(log.entryTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td style={{ padding: "1rem 0" }}>
                <div style={{ fontWeight: 500 }}>{log.guestName}</div>
                <div
                  style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
                >
                  {log.purpose} • {log.mobile}
                </div>
              </td>
              <td style={{ padding: "1rem 0", fontWeight: "bold" }}>
                {log.houseId}
              </td>
              <td style={{ padding: "1rem 0" }}>
                <span className={`badge badge-${log.status.toLowerCase()}`}>
                  {log.status}
                </span>
              </td>
              <td style={{ padding: "1rem 0", textAlign: "right" }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem" }}
                  onClick={() => softDeleteLog(log.id)}
                >
                  Remove Log
                </button>
              </td>
            </tr>
          ))}
          {visibleLogs.length === 0 && (
            <tr>
              <td
                colSpan="5"
                style={{ padding: "1rem 0", textAlign: "center" }}
              >
                No logs available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

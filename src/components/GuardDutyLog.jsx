import React, { useState } from "react";
import { useAppContext } from "../AppContext";
import { useExtensionContext } from "../ExtensionContext";

export default function GuardDutyLog() {
  const { entries, currentUser } = useAppContext();
  const { deletedLogs, softDeleteLog } = useExtensionContext();

  const [filters, setFilters] = useState({
    date: "",
    houseNo: "",
    status: "",
    guestName: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const filteredLogs = entries.filter((log) => {
    if (
      deletedLogs.includes(log.id) ||
      log.societyCode !== currentUser?.societyCode
    )
      return false;

    const matchHouse = filters.houseNo
      ? log.houseId.includes(filters.houseNo)
      : true;
    const matchStatus = filters.status ? log.status === filters.status : true;
    const matchName = filters.guestName
      ? log.guestName.toLowerCase().includes(filters.guestName.toLowerCase())
      : true;
    const matchDate = filters.date
      ? new Date(log.entryTime).toISOString().split("T")[0] === filters.date
      : true;

    return matchHouse && matchStatus && matchName && matchDate;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <h2>My Duty Logs</h2>
      <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
        Review your processed entry logs. You can remove logs from this view
        without affecting the master records.
      </p>

      <div className="grid-4-col-responsive" style={{ marginBottom: "1rem" }}>
        <input
          name="date"
          type="date"
          className="form-input"
          onChange={handleFilterChange}
        />
        <input
          name="houseNo"
          placeholder="House No..."
          className="form-input"
          onChange={handleFilterChange}
        />
        <select
          name="status"
          className="form-select"
          onChange={handleFilterChange}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <input
          name="guestName"
          placeholder="Guest Name..."
          className="form-input"
          onChange={handleFilterChange}
        />
      </div>

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
          {paginatedLogs.map((log) => (
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
          {paginatedLogs.length === 0 && (
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

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1.5rem",
          }}
        >
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: "0.875rem" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

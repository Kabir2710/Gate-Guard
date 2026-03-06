import React, { useState } from "react";
import { useAppContext } from "../AppContext";

export default function AdminEntryLogs() {
  const { entries, requireAdmin, currentUser } = useAppContext();
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
    if (log.societyCode !== currentUser?.societyCode) return false;

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

  const exportCSV = () => {
    try {
      requireAdmin();
      const headers = ["Date", "Time", "Guest", "House", "Status"];
      const csvRows = [headers.join(",")];

      filteredLogs.forEach((log) => {
        const dt = new Date(log.entryTime);
        const date = dt.toLocaleDateString();
        const time = dt.toLocaleTimeString();
        const guest = `"${log.guestName}"`;
        const house = `"${log.houseId}"`;
        const status = log.status;
        csvRows.push([date, time, guest, house, status].join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "entry_logs.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
        <h2>Complete Entry Logs</h2>
        <button onClick={exportCSV} className="btn btn-secondary">
          Export CSV
        </button>
      </div>

      <div className="grid-4-col-responsive">
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
          placeholder="Resident/Guest Name..."
          className="form-input"
          onChange={handleFilterChange}
        />
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem 0" }}>Date & Time</th>
            <th style={{ padding: "1rem 0" }}>Guest</th>
            <th style={{ padding: "1rem 0" }}>House</th>
            <th style={{ padding: "1rem 0" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLogs.map((log) => (
            <tr
              key={log.id}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td style={{ padding: "1rem 0" }}>
                {new Date(log.entryTime).toLocaleString()}
              </td>
              <td style={{ padding: "1rem 0" }}>{log.guestName}</td>
              <td style={{ padding: "1rem 0" }}>{log.houseId}</td>
              <td style={{ padding: "1rem 0" }}>
                <span className={`badge badge-${log.status.toLowerCase()}`}>
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
          {paginatedLogs.length === 0 && (
            <tr>
              <td
                colSpan="4"
                style={{ padding: "1rem 0", textAlign: "center" }}
              >
                No logs found.
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

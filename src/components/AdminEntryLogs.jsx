import React, { useState } from "react";
import { useAppContext } from "../AppContext";

export default function AdminEntryLogs() {
  const { entries, requireAdmin } = useAppContext();
  const [filters, setFilters] = useState({
    date: "",
    houseNo: "",
    status: "",
    guestName: "",
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredLogs = entries.filter((log) => {
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

  const exportPDF = () => {
    try {
      requireAdmin();
      // This enforces backend-level restriction logic inside our mocked service.
      window.print();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
        <h2>Complete Entry Logs</h2>
        <button onClick={exportPDF} className="btn btn-secondary">
          Download PDF
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
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
          {filteredLogs.map((log) => (
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
          {filteredLogs.length === 0 && (
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
    </div>
  );
}

import { useState } from "react";
import { useAppContext } from "../AppContext";
import {
  Database,
  Filter,
  LogOut,
  Download,
  DoorOpen,
  LayoutDashboard,
  FileText,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminEntryLogs from "../components/AdminEntryLogs";
import AdminGuidelines from "../components/AdminGuidelines";
import AdminManageResidents from "../components/AdminManageResidents";
import AdminManageGuards from "../components/AdminManageGuards";

export default function AdminDashboard() {
  const { entries, logout, requireAdmin, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const societyEntries = entries.filter(
    (e) => e.societyCode === currentUser?.societyCode,
  );

  const filteredEntries = societyEntries.filter(
    (e) =>
      e.guestName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      e.houseId.includes(filterQuery),
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Database /> Admin Center
        </div>
        <nav className="nav-menu">
          <a
            href="#"
            className={`nav-item ${activeTab === "Overview" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Overview");
              setSidebarOpen(false);
            }}
          >
            <LayoutDashboard size={20} /> Overview
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === "Logs" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Logs");
              setSidebarOpen(false);
            }}
          >
            <DoorOpen size={20} /> Entry Logs
          </a>

          <a
            href="#"
            className={`nav-item ${activeTab === "Residents" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Residents");
              setSidebarOpen(false);
            }}
          >
            <Database size={20} /> Manage Residents
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === "Guards" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Guards");
              setSidebarOpen(false);
            }}
          >
            <Database size={20} /> Manage Guards
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === "Guidelines" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Guidelines");
              setSidebarOpen(false);
            }}
          >
            <FileText size={20} /> Guidelines
          </a>
        </nav>
        <button
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ marginTop: "auto", width: "100%" }}
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="header flex-between">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: "1.5rem" }}>Central Dashboard</h1>
              <p style={{ fontSize: "0.875rem" }}>System Overview</p>
            </div>
          </div>
          <div className="flex-center header-actions" style={{ gap: "1rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                try {
                  requireAdmin();
                  window.print();
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              <Download size={18} /> Export
            </button>
            <div className="avatar">A</div>
          </div>
        </header>

        {activeTab === "Overview" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div
                className="card animate-fade-in flex-center"
                style={{ flexDirection: "column", padding: "2rem" }}
              >
                <h2 style={{ fontSize: "2.5rem", color: "var(--primary)" }}>
                  {societyEntries.length}
                </h2>
                <p style={{ fontWeight: "600" }}>Total Entries</p>
              </div>
              <div
                className="card animate-fade-in flex-center"
                style={{
                  flexDirection: "column",
                  padding: "2rem",
                  animationDelay: "0.1s",
                }}
              >
                <h2 style={{ fontSize: "2.5rem", color: "var(--warning)" }}>
                  {societyEntries.filter((e) => e.status === "PENDING").length}
                </h2>
                <p style={{ fontWeight: "600" }}>Pending Approvals</p>
              </div>
              <div
                className="card animate-fade-in flex-center"
                style={{
                  flexDirection: "column",
                  padding: "2rem",
                  animationDelay: "0.2s",
                }}
              >
                <h2 style={{ fontSize: "2.5rem", color: "var(--success)" }}>
                  {societyEntries.filter((e) => e.status === "APPROVED").length}
                </h2>
                <p style={{ fontWeight: "600" }}>Approved Visitors</p>
              </div>
            </div>

            <div
              className="card animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Filter size={20} /> Master Access Logs
                </h3>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by ID or Name..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  style={{ width: "300px" }}
                />
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "1rem 0" }}>Guest Details</th>
                    <th style={{ padding: "1rem 0" }}>House</th>
                    <th style={{ padding: "1rem 0" }}>Time</th>
                    <th style={{ padding: "1rem 0" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td style={{ padding: "1rem 0" }}>
                        <div style={{ fontWeight: "500" }}>
                          {entry.guestName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {entry.mobile} • {entry.purpose}
                        </div>
                      </td>
                      <td style={{ padding: "1rem 0", fontWeight: "bold" }}>
                        {entry.houseId}
                      </td>
                      <td
                        style={{
                          padding: "1rem 0",
                          fontSize: "0.875rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {new Date(entry.entryTime).toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem 0" }}>
                        <span
                          className={`badge badge-${entry.status.toLowerCase()}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "Logs" && <AdminEntryLogs />}

        {activeTab === "Residents" && <AdminManageResidents />}

        {activeTab === "Guards" && <AdminManageGuards />}

        {activeTab === "Guidelines" && <AdminGuidelines />}
      </main>
    </div>
  );
}

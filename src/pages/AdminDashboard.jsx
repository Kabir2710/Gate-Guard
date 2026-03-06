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
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminEntryLogs from "../components/AdminEntryLogs";
import AdminGuidelines from "../components/AdminGuidelines";
import AdminManageResidents from "../components/AdminManageResidents";
import AdminManageGuards from "../components/AdminManageGuards";
import EditProfile from "../components/EditProfile";

export default function AdminDashboard() {
  const { entries, logout, requireAdmin, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
            <div className="user-profile" style={{ position: "relative" }}>
              <div
                className="avatar"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ cursor: "pointer" }}
              >
                A
              </div>
              {showDropdown && (
                <div
                  className="card animate-fade-in"
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    zIndex: 10,
                    minWidth: "150px",
                  }}
                >
                  <button
                    className="btn"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      marginBottom: "0.5rem",
                      backgroundColor: "transparent",
                      color: "var(--text-main)",
                      border: "1px solid var(--border)",
                    }}
                    onClick={() => {
                      setActiveTab("Profile");
                      setShowDropdown(false);
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ width: "100%", textAlign: "left" }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
                  onChange={(e) => {
                    setFilterQuery(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  {filteredEntries
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage,
                    )
                    .map((entry) => (
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
                  {filteredEntries.length === 0 && (
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

              {Math.ceil(filteredEntries.length / itemsPerPage) > 1 && (
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
                    Page {currentPage} of{" "}
                    {Math.ceil(filteredEntries.length / itemsPerPage)}
                  </span>
                  <button
                    className="btn btn-secondary"
                    disabled={
                      currentPage ===
                      Math.ceil(filteredEntries.length / itemsPerPage)
                    }
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "Logs" && <AdminEntryLogs />}

        {activeTab === "Residents" && <AdminManageResidents />}

        {activeTab === "Guards" && <AdminManageGuards />}

        {activeTab === "Guidelines" && <AdminGuidelines />}

        {activeTab === "Profile" && <EditProfile />}
      </main>
    </div>
  );
}

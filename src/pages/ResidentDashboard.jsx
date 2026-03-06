import { useAppContext } from "../AppContext";
import {
  ShieldCheck,
  LogOut,
  CheckCircle,
  XCircle,
  Home,
  User,
  Bell,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ResidentVisitorLog from "../components/ResidentVisitorLog";
import { playNotificationSound } from "../utils/audio";

export default function ResidentDashboard() {
  const { currentUser, entries, logout, updateEntryStatus } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Approvals");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const myEntries = entries.filter((e) => e.houseId === currentUser?.houseId);
  const pendingRequests = myEntries.filter((e) => e.status === "PENDING");
  const pastEntries = myEntries.filter((e) => e.status !== "PENDING");

  const prevPendingCount = useRef(0);

  // Play sound and trigger native notification when a new pending request comes in
  useEffect(() => {
    if (pendingRequests.length > prevPendingCount.current) {
      playNotificationSound();

      // Native Browser Notification
      if ("Notification" in window) {
        try {
          if (Notification.permission === "granted") {
            new Notification("New Visitor Alert", {
              body: `You have ${pendingRequests.length} guest(s) waiting at the gate for approval.`,
              icon: "/favicon.ico",
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission()
              .then((permission) => {
                try {
                  if (permission === "granted") {
                    new Notification("New Visitor Alert", {
                      body: `You have ${pendingRequests.length} guest(s) waiting at the gate for approval.`,
                      icon: "/favicon.ico",
                    });
                  }
                } catch (e) {
                  console.warn("Async notification error:", e);
                }
              })
              .catch((err) => console.warn("Permission request failed:", err));
          }
        } catch (err) {
          console.warn(
            "Native notification not supported in this browser environment:",
            err,
          );
        }
      }
    }

    prevPendingCount.current = pendingRequests.length;
  }, [pendingRequests.length]);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Home /> Resident Portal
        </div>
        <nav className="nav-menu">
          <a
            href="#"
            className={`nav-item ${activeTab === "Approvals" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Approvals");
              setSidebarOpen(false);
            }}
          >
            <Bell size={20} /> Approvals
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === "Visitors Log" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Visitors Log");
              setSidebarOpen(false);
            }}
          >
            <User size={20} /> Visitors Log
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
              <h1 style={{ fontSize: "1.5rem" }}>Dashboard</h1>
              <p style={{ fontSize: "0.875rem" }}>
                House {currentUser?.houseId} - Secure
              </p>
            </div>
          </div>
          <div className="user-profile">
            <div className="avatar">R</div>
          </div>
        </header>

        {/* Global Notification Banner for Real-Time Approval Prompts */}
        {pendingRequests.length > 0 && (
          <div
            className="card animate-fade-in"
            style={{
              borderColor: "var(--warning)",
              marginBottom: "2rem",
              backgroundColor: "var(--warning-bg)",
            }}
          >
            <div className="flex-between">
              <div>
                <h3 style={{ color: "var(--text-main)" }}>
                  ⚠️ Action Required: Visitor at Gate
                </h3>
                <p>
                  You have {pendingRequests.length} guest(s) waiting for
                  approval
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {pendingRequests.map((entry) => (
                <div
                  key={entry.id}
                  className="glass flex-between-responsive"
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "1.25rem" }}>{entry.guestName}</h4>
                    <p style={{ fontWeight: "500" }}>
                      Purpose: {entry.purpose} • Ph: {entry.mobile}
                    </p>
                    <span style={{ fontSize: "0.875rem" }}>
                      {new Date(entry.entryTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      width: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => updateEntryStatus(entry.id, "APPROVED")}
                      className="btn btn-success"
                      style={{ flex: 1, padding: "0.5rem" }}
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button
                      onClick={() => updateEntryStatus(entry.id, "REJECTED")}
                      className="btn btn-danger"
                      style={{ flex: 1, padding: "0.5rem" }}
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Approvals" && (
          <>
            <div className="card animate-fade-in">
              <h3 style={{ marginBottom: "1.5rem" }}>Recent Visitors</h3>
              {pastEntries.length === 0 ? (
                <p>No visitor history.</p>
              ) : (
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
                      <th style={{ padding: "1rem 0" }}>Time</th>
                      <th style={{ padding: "1rem 0" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastEntries.map((entry) => (
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
                            {entry.purpose}
                          </div>
                        </td>
                        <td style={{ padding: "1rem 0", fontSize: "0.875rem" }}>
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
              )}
            </div>
          </>
        )}

        {activeTab === "Visitors Log" && <ResidentVisitorLog />}
      </main>
    </div>
  );
}

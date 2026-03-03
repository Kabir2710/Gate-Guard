import { useState } from "react";
import { useAppContext } from "../AppContext";
import {
  UserPlus,
  LogOut,
  Clock,
  ShieldCheck,
  FileText,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import GuardDutyLog from "../components/GuardDutyLog";
import GuardGuidelines from "../components/GuardGuidelines";

export default function GuardDashboard() {
  const { currentUser, entries, logout, addEntry } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("New Entry");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    guestName: "",
    mobile: "",
    houseId: "",
    purpose: "",
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNewEntry = (e) => {
    e.preventDefault();
    if (!formData.guestName || !formData.houseId) return;
    addEntry(formData);
    setFormData({ guestName: "", mobile: "", houseId: "", purpose: "" });
  };

  // Active entries (PENDING or approved/rejected recently)
  const activeEntries = entries.slice(0, 10);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <ShieldCheck /> Gate Guard
        </div>
        <nav className="nav-menu">
          <a
            href="#"
            className={`nav-item ${activeTab === "New Entry" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("New Entry");
              setSidebarOpen(false);
            }}
          >
            <UserPlus size={20} /> New Entry
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === "Duty Log" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Duty Log");
              setSidebarOpen(false);
            }}
          >
            <Clock size={20} /> Duty Log
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
              <h1 style={{ fontSize: "1.5rem" }}>Guard Station</h1>
              <p style={{ fontSize: "0.875rem" }}>
                Welcome, {currentUser?.name}
              </p>
            </div>
          </div>
          <div className="user-profile">
            <div className="avatar">G</div>
          </div>
        </header>

        {activeTab === "New Entry" && (
          <div className="grid-2-col-responsive">
            <div className="card animate-fade-in">
              <h3>New Guest Request</h3>
              <p style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>
                Fill details to notify resident instantly
              </p>

              <form onSubmit={handleNewEntry}>
                <div className="form-group">
                  <label className="form-label">Guest Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.guestName}
                    onChange={(e) =>
                      setFormData({ ...formData, guestName: e.target.value })
                    }
                    placeholder="e.g. Amazon Delivery"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    placeholder="10-digit number"
                  />
                </div>
                <div className="grid-2-col-sm-responsive">
                  <div className="form-group">
                    <label className="form-label">Visiting House ID</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.houseId}
                      onChange={(e) =>
                        setFormData({ ...formData, houseId: e.target.value })
                      }
                      placeholder="e.g. 101"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purpose</label>
                    <select
                      className="form-select"
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData({ ...formData, purpose: e.target.value })
                      }
                    >
                      <option value="">Select...</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Relative">Relative/Friend</option>
                      <option value="Service">Service/Maintenance</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "1rem" }}
                >
                  Send Request to Resident
                </button>
              </form>
            </div>

            <div
              className="card animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <h3 style={{ marginBottom: "1.5rem" }}>Active Requests Queue</h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {activeEntries.length === 0 ? (
                  <p>No active entries.</p>
                ) : (
                  activeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex-between-responsive"
                      style={{
                        padding: "1rem",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: "1rem" }}>{entry.guestName}</h4>
                        <p style={{ fontSize: "0.875rem" }}>
                          House: {entry.houseId} • {entry.purpose}
                        </p>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Time: {new Date(entry.entryTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`badge badge-${entry.status.toLowerCase()}`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Duty Log" && <GuardDutyLog />}
        {activeTab === "Guidelines" && <GuardGuidelines />}
      </main>
    </div>
  );
}

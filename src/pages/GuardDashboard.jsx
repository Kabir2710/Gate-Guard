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
import EditProfile from "../components/EditProfile";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function GuardDashboard() {
  const { currentUser, entries, logout, addEntry } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("New Entry");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handleNewEntry = async (e) => {
    e.preventDefault();
    if (!formData.guestName || !formData.houseId) return;

    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "RESIDENT"),
        where("societyCode", "==", currentUser?.societyCode),
        where("houseId", "==", formData.houseId),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("No resident found for this house number in your society.");
        return;
      }

      addEntry({ ...formData, societyCode: currentUser?.societyCode });
      setFormData({ guestName: "", mobile: "", houseId: "", purpose: "" });
    } catch (err) {
      alert("Error checking house number: " + err.message);
    }
  };

  // Active entries (PENDING or approved/rejected recently)
  const activeEntries = entries
    .filter((e) => e.societyCode === currentUser?.societyCode)
    .slice(0, 10);

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
          <div className="flex-center header-actions" style={{ gap: "1rem" }}>
            <div className="user-profile" style={{ position: "relative" }}>
              <div
                className="avatar"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ cursor: "pointer" }}
              >
                G
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
        {activeTab === "Profile" && <EditProfile />}
      </main>
    </div>
  );
}

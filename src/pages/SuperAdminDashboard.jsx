import React, { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  Shield,
  Building,
  Users,
  Activity,
  LogOut,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EditProfile from "../components/EditProfile";

export default function SuperAdminDashboard() {
  const { logout, signup } = useAppContext();
  const navigate = useNavigate();

  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Societies");

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const adminsSnap = await getDocs(
        query(usersRef, where("role", "==", "ADMIN")),
      );
      const residentsSnap = await getDocs(
        query(usersRef, where("role", "==", "RESIDENT")),
      );
      const guardsSnap = await getDocs(
        query(usersRef, where("role", "==", "GUARD")),
      );

      const residentsData = docsToData(residentsSnap);
      const guardsData = docsToData(guardsSnap);
      const adminsData = docsToData(adminsSnap);

      const societiesData = adminsData.map((admin) => {
        const adminSocietyCode = admin.societyCode || "N/A";
        return {
          ...admin,
          residentCount: residentsData.filter(
            (r) => r.societyCode === adminSocietyCode,
          ).length,
          guardCount: guardsData.filter(
            (g) => g.societyCode === adminSocietyCode,
          ).length,
        };
      });

      setSocieties(societiesData);
    } catch (err) {
      console.error("Error fetching societies data:", err);
    } finally {
      setLoading(false);
    }
  };

  const docsToData = (snapshot) => {
    const data = [];
    snapshot.forEach((doc) => data.push(doc.data()));
    return data;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const genCode = `SOC-${Math.floor(1000 + Math.random() * 9000)}`;
      await signup(
        "ADMIN",
        adminName,
        adminEmail,
        adminPassword,
        null,
        genCode,
        true,
      );

      setSuccess(`Society Admin created successfully! Code: ${genCode}`);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setShowForm(false);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleSubAdmin = async (adminId, currentIsActive) => {
    if (
      !window.confirm(
        currentIsActive !== false
          ? "Are you sure you want to disable this Admin? They will be unable to login."
          : "Are you sure you want to activate this Admin?",
      )
    )
      return;
    try {
      await updateDoc(doc(db, "users", adminId), {
        isActive: currentIsActive === false ? true : false,
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete admin: " + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar open">
        <div className="sidebar-logo">
          <Shield /> Super Admin
        </div>
        <nav className="nav-menu">
          <a
            href="#"
            className={`nav-item ${activeTab === "Societies" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Societies");
            }}
          >
            <Building size={20} /> Societies
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === "Profile" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Profile");
            }}
          >
            <Settings size={20} /> Profile
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
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>Global Network Operations</h1>
            <p style={{ fontSize: "0.875rem" }}>Super Administrator Portal</p>
          </div>
          <div className="flex-center header-actions" style={{ gap: "1rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={18} /> Add Society
            </button>
            <div className="avatar">SA</div>
          </div>
        </header>

        {error && (
          <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: "var(--success)", marginBottom: "1rem" }}>
            {success}
          </div>
        )}

        {showForm && (
          <div
            className="card animate-fade-in"
            style={{ padding: "1.5rem", marginBottom: "2rem" }}
          >
            <h3 style={{ marginBottom: "1rem" }}>Create New Society Admin</h3>
            <form
              onSubmit={handleCreateAdmin}
              className="grid-3-col-auto-responsive"
            >
              <input
                required
                type="text"
                className="form-input"
                placeholder="Admin Name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
              <input
                required
                type="email"
                className="form-input"
                placeholder="Admin Email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <input
                required
                type="password"
                className="form-input"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
                style={{ gridColumn: "1 / -1" }}
              >
                {formLoading
                  ? "Creating..."
                  : "Save Admin & Generate Society Code"}
              </button>
            </form>
          </div>
        )}

        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: "1rem" }}>Managed Societies</h3>
          {loading ? (
            <p>Loading network data...</p>
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
                  <th style={{ padding: "1rem 0" }}>Society Info</th>
                  <th style={{ padding: "1rem 0" }}>Code</th>
                  <th style={{ padding: "1rem 0" }}>Guards</th>
                  <th style={{ padding: "1rem 0" }}>Residents</th>
                  <th style={{ padding: "1rem 0" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {societies.map((soc) => (
                  <tr
                    key={soc.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "1rem 0" }}>
                      <div style={{ fontWeight: "500" }}>{soc.name}</div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {soc.email}
                      </div>
                    </td>
                    <td style={{ padding: "1rem 0", fontWeight: "bold" }}>
                      {soc.societyCode}
                    </td>
                    <td style={{ padding: "1rem 0" }}>
                      <Activity size={14} style={{ marginRight: "0.25rem" }} />
                      {soc.guardCount}
                    </td>
                    <td style={{ padding: "1rem 0" }}>
                      <Users size={14} style={{ marginRight: "0.25rem" }} />
                      {soc.residentCount}
                    </td>
                    <td style={{ padding: "1rem 0" }}>
                      <button
                        className={`btn ${soc.isActive === false ? "btn-success" : "btn-danger"}`}
                        onClick={() =>
                          handleToggleSubAdmin(soc.uid, soc.isActive)
                        }
                      >
                        {soc.isActive === false ? (
                          "Activate"
                        ) : (
                          <>
                            <Trash2 size={16} /> Disable
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {societies.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ padding: "1rem 0", textAlign: "center" }}
                    >
                      No societies managed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {activeTab === "Profile" && <EditProfile />}
      </main>
    </div>
  );
}

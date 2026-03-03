import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import { Shield } from "lucide-react";
import { unlockAudio } from "../utils/audio";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);

  // Form State
  const [role, setRole] = useState("ADMIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [houseId, setHouseId] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    unlockAudio(); // Unlock audio context on first user interaction to bypass mobile browser limits

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isSignup) {
        if (!email || !password || !name)
          throw new Error("Please fill in all required fields");
        if (role === "RESIDENT" && !houseId)
          throw new Error("House ID required for Residents");

        const res = await signup(role, name, email, password, houseId);
        setSuccessMsg(res.message);
        setIsSignup(false); // Switch to login view
        setPassword(""); // Clear password for login
      } else {
        if (!email || !password)
          throw new Error("Email and Password are required");

        const user = await login(email, password);
        navigate(`/${user.role.toLowerCase()}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex-center"
      style={{ minHeight: "100vh", background: "var(--bg-color)" }}
    >
      <div
        className="card animate-fade-in"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div
          className="flex-center"
          style={{ flexDirection: "column", marginBottom: "2rem" }}
        >
          <div
            className="avatar"
            style={{ width: "64px", height: "64px", marginBottom: "1rem" }}
          >
            <Shield size={32} />
          </div>
          <h2 style={{ textAlign: "center" }}>Gate Guard</h2>
          <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
            Secure Society Management
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "var(--danger-bg)",
              color: "var(--danger)",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              border: "1px solid var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              backgroundColor: "var(--success-bg, #e8f5e9)",
              color: "var(--success, #2e7d32)",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              border: "1px solid var(--success, #2e7d32)",
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div className="form-group animate-fade-in">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ADMIN">System Admin</option>
                  <option value="GUARD">Security Guard</option>
                  <option value="RESIDENT">Resident</option>
                </select>
              </div>

              <div className="form-group animate-fade-in">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {role === "RESIDENT" && (
                <div className="form-group animate-fade-in">
                  <label className="form-label">House Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={houseId}
                    onChange={(e) => setHouseId(e.target.value)}
                    placeholder="e.g. 101"
                    required
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group animate-fade-in">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group animate-fade-in">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder={
                isSignup ? "Create a strong password" : "Enter password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : isSignup
                ? "Register Account"
                : "Secure Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setSuccessMsg("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isSignup
              ? "Already have an account? Log in."
              : "Don't have an account? Sign up."}
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          {!isSignup && (
            <>
              <p>Demo Admin: admin@system.com / admin123</p>
              <p>Demo Guard: rakesh@guard.com / guard123</p>
              <p>Demo Res (101): resi101@society.com / resident123</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

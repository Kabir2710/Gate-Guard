import React, { useState } from "react";
import { useAppContext } from "../AppContext";
import { auth, db } from "../firebase";
import { verifyBeforeUpdateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export default function EditProfile() {
  const { currentUser } = useAppContext();
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user.");

      const sanitizedEmail = email.trim().toLowerCase();
      const isDemoAccount = [
        "admin@system.com",
        "rakesh@guard.com",
        "resi101@society.com",
      ].includes(sanitizedEmail);

      if (!isDemoAccount && sanitizedEmail !== currentUser.email) {
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(sanitizedEmail)) {
          throw new Error("Only official @gmail.com addresses are permitted.");
        }
      }

      let emailVerificationSent = false;
      if (sanitizedEmail !== currentUser.email) {
        await verifyBeforeUpdateEmail(user, sanitizedEmail);
        emailVerificationSent = true;
      }
      if (password) {
        await updatePassword(user, password);
      }

      const userRef = doc(db, "users", currentUser.uid);
      const updateData = {
        name: name,
        email: sanitizedEmail,
      };
      await updateDoc(userRef, updateData);

      const saved = JSON.parse(localStorage.getItem("gateGuardUser"));
      if (saved) {
        saved.name = name;
        saved.email = sanitizedEmail;
        localStorage.setItem("gateGuardUser", JSON.stringify(saved));
      }

      setSuccess(
        emailVerificationSent
          ? "Verification link sent. Please confirm the change via email. Profile name/password updated."
          : "Profile updated successfully!",
      );
      setPassword("");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError(
          "For security reasons, please log out and log back in to change your email or password.",
        );
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError(
          "Email updates are currently disabled in the server configuration. Please contact your administrator.",
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card animate-fade-in"
      style={{ padding: "2rem", maxWidth: "600px" }}
    >
      <h2>Edit Profile</h2>
      <p style={{ marginBottom: "2rem", color: "var(--text-muted)" }}>
        Update your account details. Society codes cannot be modified.
      </p>

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

      <form
        onSubmit={handleUpdate}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            required
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            required
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            New Password (Leave blank to keep current)
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="New password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Society Code</label>
          <input
            type="text"
            className="form-input"
            value={currentUser?.societyCode || "N/A"}
            disabled
            title="Society code cannot be changed"
            style={{
              backgroundColor: "var(--bg-color)",
              cursor: "not-allowed",
              opacity: 0.7,
            }}
          />
        </div>

        {currentUser?.role === "RESIDENT" && (
          <div className="form-group">
            <label className="form-label">House Number</label>
            <input
              type="text"
              className="form-input"
              value={currentUser?.houseId}
              disabled
              title="Only your Society Admin can change your house number."
              style={{
                backgroundColor: "var(--bg-color)",
                cursor: "not-allowed",
                opacity: 0.7,
              }}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: "1rem" }}
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

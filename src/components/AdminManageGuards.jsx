import React, { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function AdminManageGuards() {
  const { currentUser, signup } = useAppContext();
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGuards = async () => {
    setLoading(true);
    try {
      if (!currentUser?.societyCode) return;

      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("role", "==", "GUARD"),
        where("societyCode", "==", currentUser.societyCode),
      );

      const snapshot = await getDocs(q);
      const data = [];
      snapshot.forEach((doc) => data.push(doc.data()));

      setGuards(data);
    } catch (err) {
      console.error("Error fetching guards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, [currentUser]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);
    try {
      await signup(
        "GUARD",
        name,
        email,
        password,
        null,
        currentUser.societyCode,
        true,
      );
      setName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
      fetchGuards();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (guardId) => {
    if (!window.confirm("Are you sure you want to remove this guard?")) return;
    try {
      await deleteDoc(doc(db, "users", guardId));
      fetchGuards();
    } catch (err) {
      alert("Failed to remove guard: " + err.message);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <div className="flex-between" style={{ marginBottom: "1rem" }}>
        <h2>Manage Guards</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Guard"}
        </button>
      </div>
      <p style={{ marginBottom: "2rem", color: "var(--text-muted)" }}>
        Real-time view of security guards registered in your society (
        {currentUser?.societyCode}).
      </p>

      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid-3-col-auto-responsive"
          style={{ marginBottom: "2rem" }}
        >
          <input
            required
            type="text"
            className="form-input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            className="form-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={formLoading}
            style={{ gridColumn: "1 / -1" }}
          >
            {formLoading ? "Adding..." : "Add Guard"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading guards...</p>
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
              <th style={{ padding: "1rem 0" }}>Guard Name</th>
              <th style={{ padding: "1rem 0" }}>Email</th>
              <th style={{ padding: "1rem 0" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guards.map((guard) => (
              <tr
                key={guard.uid}
                style={{
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <td style={{ padding: "1rem 0", fontWeight: "500" }}>
                  {guard.name}
                </td>
                <td style={{ padding: "1rem 0" }}>{guard.email}</td>
                <td style={{ padding: "1rem 0" }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(guard.uid)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {guards.length === 0 && (
              <tr>
                <td
                  colSpan="3"
                  style={{ padding: "1rem 0", textAlign: "center" }}
                >
                  No guards registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

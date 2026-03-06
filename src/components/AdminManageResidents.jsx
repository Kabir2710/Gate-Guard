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
  updateDoc,
} from "firebase/firestore";

export default function AdminManageResidents() {
  const { currentUser, signup } = useAppContext();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [houseId, setHouseId] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResidents = async () => {
    setLoading(true);
    try {
      if (!currentUser?.societyCode) return;

      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("role", "==", "RESIDENT"),
        where("societyCode", "==", currentUser.societyCode),
      );

      const snapshot = await getDocs(q);
      const data = [];
      snapshot.forEach((doc) => data.push(doc.data()));

      setResidents(data);
    } catch (err) {
      console.error("Error fetching residents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [currentUser]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);
    try {
      await signup(
        "RESIDENT",
        name,
        email,
        password,
        houseId,
        currentUser.societyCode,
        true,
      );
      setName("");
      setEmail("");
      setPassword("");
      setHouseId("");
      setShowForm(false);
      fetchResidents();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (resId) => {
    if (!window.confirm("Are you sure you want to remove this resident?"))
      return;
    try {
      await deleteDoc(doc(db, "users", resId));
      fetchResidents();
    } catch (err) {
      alert("Failed to remove resident: " + err.message);
    }
  };

  const handleEditHouse = async (res) => {
    const newHouseId = window.prompt(
      "Enter new house number for " + res.name,
      res.houseId,
    );
    if (!newHouseId || newHouseId === res.houseId) return;

    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "RESIDENT"),
        where("houseId", "==", newHouseId),
        where("societyCode", "==", currentUser.societyCode),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert(
          `An account already exists for House No: ${newHouseId} in this society`,
        );
        return;
      }

      await updateDoc(doc(db, "users", res.uid), { houseId: newHouseId });
      fetchResidents();
    } catch (err) {
      alert("Error updating house number: " + err.message);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <div className="flex-between" style={{ marginBottom: "1rem" }}>
        <h2>Manage Residents</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Resident"}
        </button>
      </div>
      <p style={{ marginBottom: "2rem", color: "var(--text-muted)" }}>
        Real-time view of residents registered in your society (
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
          <input
            required
            type="text"
            className="form-input"
            placeholder="House ID"
            value={houseId}
            onChange={(e) => setHouseId(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={formLoading}
            style={{ gridColumn: "1 / -1" }}
          >
            {formLoading ? "Adding..." : "Add Resident"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading residents...</p>
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
              <th style={{ padding: "1rem 0" }}>Resident Name</th>
              <th style={{ padding: "1rem 0" }}>House ID</th>
              <th style={{ padding: "1rem 0" }}>Email</th>
              <th style={{ padding: "1rem 0" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {residents.map((res) => (
              <tr
                key={res.uid}
                style={{
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <td style={{ padding: "1rem 0", fontWeight: "500" }}>
                  {res.name}
                </td>
                <td style={{ padding: "1rem 0" }}>{res.houseId}</td>
                <td style={{ padding: "1rem 0" }}>{res.email}</td>
                <td style={{ padding: "1rem 0" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ marginRight: "0.5rem" }}
                    onClick={() => handleEditHouse(res)}
                  >
                    Edit House
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(res.uid)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {residents.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{ padding: "1rem 0", textAlign: "center" }}
                >
                  No residents registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

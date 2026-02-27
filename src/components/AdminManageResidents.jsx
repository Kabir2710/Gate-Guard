import React, { useState } from "react";
import { useExtensionContext } from "../ExtensionContext";

export default function AdminManageResidents() {
  const { residents, addResident, updateResident, deleteResident } =
    useExtensionContext();
  const [formData, setFormData] = useState({
    name: "",
    houseId: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateResident(editingId, formData);
      setEditingId(null);
    } else {
      addResident(formData);
    }
    setFormData({ name: "", houseId: "", isActive: true });
  };

  const editHandler = (res) => {
    setFormData({
      name: res.name,
      houseId: res.houseId,
      isActive: res.isActive,
    });
    setEditingId(res.id);
  };

  const toggleDeactivate = (res) => {
    updateResident(res.id, { isActive: !res.isActive });
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <h2>Manage Residents</h2>

      <form onSubmit={handleSubmit} className="grid-3-col-auto-responsive">
        <input
          required
          className="form-input"
          placeholder="Resident Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          required
          className="form-input"
          placeholder="House ID (e.g., 101)"
          value={formData.houseId}
          onChange={(e) =>
            setFormData({ ...formData, houseId: e.target.value })
          }
        />
        <button type="submit" className="btn btn-primary">
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      <table
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem 0" }}>Resident Name</th>
            <th style={{ padding: "1rem 0" }}>House ID / Login ID</th>
            <th style={{ padding: "1rem 0" }}>Status</th>
            <th style={{ padding: "1rem 0" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((res) => (
            <tr
              key={res.id}
              style={{
                borderBottom: "1px solid var(--border)",
                opacity: res.isActive ? 1 : 0.6,
              }}
            >
              <td style={{ padding: "1rem 0" }}>
                {res.name} {res.id === "R1" ? "[Default]" : ""}
              </td>
              <td style={{ padding: "1rem 0" }}>
                {res.houseId} / {res.id}
              </td>
              <td style={{ padding: "1rem 0" }}>
                <span
                  className={`badge ${res.isActive ? "badge-approved" : "badge-rejected"}`}
                >
                  {res.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td style={{ padding: "1rem 0", display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => editHandler(res)}
                >
                  Edit
                </button>
                <button
                  className={`btn ${res.isActive ? "btn-danger" : "btn-success"}`}
                  onClick={() => toggleDeactivate(res)}
                >
                  {res.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => deleteResident(res.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

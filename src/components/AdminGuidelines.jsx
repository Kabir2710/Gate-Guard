import React, { useState, useEffect } from "react";
import { useExtensionContext } from "../ExtensionContext";

export default function AdminGuidelines() {
  const { guidelines, updateGuidelines } = useExtensionContext();
  const [text, setText] = useState(guidelines);

  useEffect(() => {
    setText(guidelines);
  }, [guidelines]);

  const handleSave = () => {
    updateGuidelines(text);
    alert("Guidelines updated successfully!");
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <h2>Society Guidelines (Editable)</h2>
      <p style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>
        These guidelines will be visible to all Security Guards on duty.
      </p>

      <textarea
        className="form-input"
        style={{
          width: "100%",
          height: "300px",
          resize: "vertical",
          fontFamily: "monospace",
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="btn btn-primary"
        style={{ marginTop: "1rem" }}
        onClick={handleSave}
      >
        Save Guidelines
      </button>
    </div>
  );
}

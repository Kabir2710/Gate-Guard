import React from "react";
import { useExtensionContext } from "../ExtensionContext";

export default function GuardGuidelines() {
  const { guidelines } = useExtensionContext();

  return (
    <div className="card animate-fade-in" style={{ padding: "2rem" }}>
      <h2>Society Guidelines & Security Instructions</h2>
      <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
        Please follow these rules and protocols strictly. These instructions are
        maintained by the Admin.
      </p>

      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "var(--bg-main)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: "1rem",
        }}
      >
        {guidelines || "No guidelines have been set by the Admin yet."}
      </div>
    </div>
  );
}

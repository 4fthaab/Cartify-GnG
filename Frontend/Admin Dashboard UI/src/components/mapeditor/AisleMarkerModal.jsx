// src/components/mapeditor/AisleMarkerModal.jsx
import React, { useState } from "react";

export default function AisleMarkerModal({ initial, racks, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(initial);
  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "24px",
          width: "100%",
          maxWidth: "420px",
          margin: "0 16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#111" }}>
          {initial.id ? "Edit Aisle Marker" : "Add Aisle Marker"}
        </h2>

        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Aisle Name</div>
          <input
            value={form.aisle_name}
            onChange={(e) => update("aisle_name", e.target.value)}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px", boxSizing: "border-box" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Left Rack</div>
          <select
            value={form.left_rack_id || ""}
            onChange={(e) => update("left_rack_id", e.target.value || null)}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
          >
            <option value="">None</option>
            {racks.map((r) => (
              <option key={r.rack_id} value={r.rack_id}>{r.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Right Rack</div>
          <select
            value={form.right_rack_id || ""}
            onChange={(e) => update("right_rack_id", e.target.value || null)}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
          >
            <option value="">None</option>
            {racks.map((r) => (
              <option key={r.rack_id} value={r.rack_id}>{r.name}</option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {initial.id && (
            <button
              onClick={onDelete}
              style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", padding: "7px 16px", cursor: "pointer", fontSize: "14px" }}
            >
              Delete
            </button>
          )}
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            <button
              onClick={onClose}
              style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "4px", padding: "7px 16px", cursor: "pointer", fontSize: "14px" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", padding: "7px 16px", cursor: "pointer", fontSize: "14px" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
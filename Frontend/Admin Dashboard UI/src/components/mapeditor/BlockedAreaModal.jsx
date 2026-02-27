// src/components/mapeditor/BlockedAreaModal.jsx
import React, { useState } from "react";

export default function BlockedAreaModal({ initial, onSave, onDelete, onClose }) {
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
          Edit Area
        </h2>

        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Label</div>
          <input
            value={form.label}
            onChange={(e) => update("label", e.target.value)}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px", boxSizing: "border-box" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Type</div>
          <select
            value={form.zoneType}
            onChange={(e) => update("zoneType", e.target.value)}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
          >
            <option value="wall">Wall</option>
            <option value="billing">Billing</option>
            <option value="entry">Entry</option>
            <option value="restricted">Restricted</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <label>
            <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Width</div>
            <input
              type="number"
              value={form.w}
              min={1}
              onChange={(e) => update("w", Number(e.target.value))}
              style={{ width: "80px", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
            />
          </label>
          <label>
            <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Height</div>
            <input
              type="number"
              value={form.h}
              min={1}
              onChange={(e) => update("h", Number(e.target.value))}
              style={{ width: "80px", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onDelete}
            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", padding: "7px 16px", cursor: "pointer", fontSize: "14px" }}
          >
            Delete
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
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
// src/components/mapeditor/RackModal.jsx
import React, { useState } from "react";

export default function RackModal({ initial, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(
    initial || {
      rack_id: `tmp-${Date.now()}`,
      name: "",
      total_columns: 20,
      orientation: "horizontal",
      facing: "bottom",
      category: "",
      color: "#FEE2E2",
    }
  );

  const handle = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    if (!form.name) return alert("Rack name required");
    if (form.total_columns < 1 || form.total_columns > 100)
      return alert("Total columns must be between 1 and 100");
    onSave(form);
  };

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
          maxWidth: "480px",
          margin: "0 16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#111" }}>
          Edit Rack
        </h2>

        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Rack Name</div>
          <input
            value={form.name}
            onChange={(e) => handle("name", e.target.value)}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px", boxSizing: "border-box" }}
          />
        </label>

        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Category</div>
            <input
              value={form.category}
              onChange={(e) => handle("category", e.target.value)}
              style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Color</div>
            <input
              type="color"
              value={form.color || "#FEE2E2"}
              onChange={(e) => handle("color", e.target.value)}
              style={{ width: "100%", height: "36px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
            />
          </label>
        </div>

        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Total Columns</div>
          <input
            type="number"
            value={form.total_columns}
            min={1}
            onChange={(e) => handle("total_columns", Number(e.target.value))}
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px", boxSizing: "border-box" }}
          />
        </label>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Orientation</div>
            <select
              value={form.orientation}
              onChange={(e) => {
                const o = e.target.value;
                handle("orientation", o);
                handle("facing", o === "horizontal" ? "bottom" : "right");
              }}
              style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>

          <label style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", marginBottom: "4px", color: "#444" }}>Facing (Open Side)</div>
            <select
              value={form.facing}
              onChange={(e) => handle("facing", e.target.value)}
              style={{ width: "100%", border: "1px solid #ccc", borderRadius: "4px", padding: "6px 8px", fontSize: "14px" }}
            >
              {form.orientation === "horizontal" ? (
                <>
                  <option value="top">Top (North)</option>
                  <option value="bottom">Bottom (South)</option>
                </>
              ) : (
                <>
                  <option value="left">Left (West)</option>
                  <option value="right">Right (East)</option>
                </>
              )}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => { if (window.confirm("Delete this rack?")) onDelete(); }}
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
              onClick={submit}
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
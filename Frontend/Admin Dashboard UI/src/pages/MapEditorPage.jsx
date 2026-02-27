// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import GridCanvas from "../components/mapeditor/GridCanvas";
import RackModal from "../components/mapeditor/RackModal";
import BlockedAreaModal from "../components/mapeditor/BlockedAreaModal";
import AisleMarkerModal from "../components/mapeditor/AisleMarkerModal";

const btn = (bg) => ({
  backgroundColor: bg,
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "7px 14px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const inputStyle = {
  border: "1px solid #4b5563",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "13px",
  background: "#1e293b",
  color: "#f1f5f9",
  width: "90px",
};

const labelStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  marginBottom: "4px",
  display: "block",
};

export default function App() {
  const FEET_PER_CELL = 3;
  const [storeArea, setStoreArea] = useState({ lengthFt: 75, widthFt: 30 });
  const [elements, setElements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("rack");
  const [editing, setEditing] = useState(null);
  const [editingBlocked, setEditingBlocked] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editingAisle, setEditingAisle] = useState(null);
  const [showWalkable, setShowWalkable] = useState(false);


  const lengthRef = useRef(storeArea.lengthFt);
  const widthRef = useRef(storeArea.widthFt);

  const gridSize = {
    length: Math.ceil(storeArea.lengthFt / FEET_PER_CELL),
    width: Math.ceil(storeArea.widthFt / FEET_PER_CELL),
    cellSizePx: 1,
  };

  const getRackSize = (orientation, length) => {
    const depth = 1;
    return orientation === "horizontal"
      ? { w: length, h: depth }
      : { w: depth, h: length };
  };

  const createRack = () => {
    const defaultCols = 10;
    const orientation = "horizontal";
    const facing = "bottom";
    const { w, h } = getRackSize(orientation, defaultCols);

    const newRack = {
      type: "rack",
      rack_id: null,   // 🔴 TEMP, will be generated on save
      name: "",
      x: 0,
      y: 0,
      w,
      h,
      meta: {
        total_columns: defaultCols,
        orientation,
        facing,
        category: "",
        color: "#FEE2E2",
      },
    };

    setEditing(newRack);
    setShowModal(true);
  };

  useEffect(() => {
    const handler = () => setMode("rack");
    document.addEventListener("exit-blocked-mode", handler);
    return () => document.removeEventListener("exit-blocked-mode", handler);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (!selected) return;
      if (e.key !== "Delete") return;

      setElements(prev =>
        prev
          // First: remove rack if selected
          .filter(el =>
            !(el.type === "rack" && el.rack_id === selected)
          )
          // Then: clean aisle markers
          .map(el => {
            if (el.type === "aisle_marker") {
              if (el.left_rack_id === selected) el.left_rack_id = null;
              if (el.right_rack_id === selected) el.right_rack_id = null;
            }
            return el;
          })
          // Finally: remove aisle marker if both sides null
          .filter(el =>
            el.type !== "aisle_marker" ||
            el.left_rack_id ||
            el.right_rack_id
          )
          // Also allow deleting blocked or aisle directly
          .filter(el =>
            el.id !== selected
          )
      );

      setSelected(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected]);


  const generateRackId = (storeId, elements) => {
    const racks = elements.filter(el => el.type === "rack");
    const nums = racks
      .map(r => r.rack_id)
      .filter(Boolean)
      .map(id => parseInt(id.replace(`${storeId}r`, ""), 10))
      .filter(n => !isNaN(n));

    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${storeId}r${String(next).padStart(2, "0")}`;
  };

  const updateRack = (updated) => {
    setElements((prev) =>
      prev.map((el) =>
        el.type === "rack" && el.rack_id === updated.rack_id
          ? { ...updated, type: "rack" }
          : el
      )
    );
  };

  const updateElement = (updated) => {
    setElements(prev =>
      prev.map(el => {
        if (el.type === "aisle_marker" && el.id === updated.id) {
          const adj = getAdjacentRacks(updated.x, updated.y);
          return {
            ...updated,
            left_rack_id: adj.left,
            right_rack_id: adj.right,
          };
        }

        if (el.type === updated.type && el.id === updated.id) {
          return updated;
        }

        return el;
      })
    );
  };

  const saveMeta = (meta) => {
    const totalCols = Number(meta.total_columns);
    if (!totalCols || totalCols < 1) {
      alert("Invalid column count");
      return;
    }

    const { w, h } = getRackSize(meta.orientation, totalCols);

    setElements((prev) => {
      const isNew = !editing.rack_id;

      const rack_id = editing.rack_id
        ? editing.rack_id
        : generateRackId("str001", prev);

      const updatedRack = {
        ...editing,          // preserves x, y
        type: "rack",
        rack_id,
        name: meta.name,
        w,
        h,
        meta: {
          total_columns: meta.total_columns,
          orientation: meta.orientation,
          facing: meta.facing,
          category: meta.category,
          color: meta.color,
        },
      };

      return isNew
        ? [...prev, updatedRack]   // ✅ INSERT
        : prev.map((el) =>         // ✅ UPDATE
          el.type === "rack" && el.rack_id === rack_id
            ? updatedRack
            : el
        );
    });

    setShowModal(false);
    setEditing(null);
  };

  const normalizeAisleName = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, "")   // remove ALL spaces
      .trim();
  const saveAisle = (form) => {
    const normalized = normalizeAisleName(form.aisle_name);
    if (!normalized) {
      alert("Aisle name required.");
      return;
    }

    if (!form.left_rack_id && !form.right_rack_id) {
      alert("Select at least one rack.");
      return;
    }

    const duplicate = elements.some(
      el =>
        el.type === "aisle_marker" &&
        el.aisle_name === normalized &&
        el.id !== form.id
    );

    if (duplicate) {
      alert("Aisle name already exists.");
      return;
    }

    // NEW
    if (!form.id) {
      const id = getNextArucoId();
      if (!id) return;

      setElements(prev => [
        ...prev,
        {
          ...form,
          type: "aisle_marker",
          id,
          aisle_name: normalized,
        },
      ]);
    } else {
      // UPDATE
      setElements(prev =>
        prev.map(el =>
          el.type === "aisle_marker" && el.id === form.id
            ? { ...form, aisle_name: normalized }
            : el
        )
      );
    }

    setEditingAisle(null);
    setMode("rack");
  };

  const deleteRack = (rack_id) => {
    setElements((prev) =>
      prev.filter((el) => !(el.type === "rack" && el.rack_id === rack_id))
    );
    setShowModal(false);
  };

  const getNextArucoId = () => {
    const used = elements
      .filter(el => el.type === "aisle_marker")
      .map(el => el.id);

    for (let i = 1; i <= 255; i++) {
      if (!used.includes(i)) return i;
    }

    alert("Maximum 255 aisle markers reached.");
    return null;
  };

  const exportJSON = () => {
    const out = {
      version: "1.0",
      floor_area: {
        length_ft: storeArea.lengthFt,
        width_ft: storeArea.widthFt,
        feet_per_cell: FEET_PER_CELL,
      },
      elements: elements.map((el) => {
        if (el.type === "rack") {
          return {
            type: "rack",
            rack_id: el.rack_id,
            name: el.name,
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
            meta: el.meta,
          };
        }

        if (el.type === "blocked") {
          return {
            type: "blocked",
            id: el.id,
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
            label: el.label || "Blocked",
            zoneType: el.zoneType || "wall",
          };
        }

        if (el.type === "aisle_marker") {
          return {
            type: "aisle_marker",
            id: el.id,
            aisle_name: el.aisle_name,
            x: el.x,
            y: el.y,
            left_rack_id: el.left_rack_id,
            right_rack_id: el.right_rack_id,
          };
        }

        return el;
      }),
      last_updated: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(out, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "store-layout.json";
    a.click();
  };

  const applyArea = () => {
    const l = Number(lengthRef.current.value);
    const w = Number(widthRef.current.value);
    if (l < 15 || w < 15) {
      alert("Minimum store size is 15×15 ft");
      return;
    }
    setStoreArea({ lengthFt: l, widthFt: w });
  };

  const importJSON = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);

        const area = data.floor_area || data.store;
        if (!area || !Array.isArray(data.elements)) {
          alert("Invalid layout JSON");
          return;
        }

        setStoreArea({
          lengthFt: area.length_ft,
          widthFt: area.width_ft,
        });

        const imported = data.elements.map((el) => {
          if (el.type === "rack") {
            return {
              type: "rack",
              rack_id: el.rack_id,
              name: el.name,
              x: el.x,
              y: el.y,
              w: el.w,
              h: el.h,
              meta: el.meta,
            };
          }

          if (el.type === "blocked") {
            return {
              type: "blocked",
              id: el.id || `blk-${Date.now()}`,
              x: el.x,
              y: el.y,
              w: el.w,
              h: el.h,
              label: el.label || "Blocked",
              zoneType: el.zoneType || "wall",
            };
          }
          if (el.type === "aisle_marker") {
            return {
              type: "aisle_marker",
              id: el.id,
              aisle_name: el.aisle_name,
              x: el.x,
              y: el.y,
              left_rack_id: el.left_rack_id || null,
              right_rack_id: el.right_rack_id || null,
            };
          }
          return el;
        });

        setElements(imported);
      } catch (err) {
        alert("Failed to import layout");
      }
    };

    reader.readAsText(f);
  };

  const getAdjacentRacks = (x, y) => {
    const racks = elements.filter(el => el.type === "rack");

    const found = [];

    const adjacentCells = [
      { x: x - 1, y }, // left
      { x: x + 1, y }, // right
      { x, y: y - 1 }, // top
      { x, y: y + 1 }, // bottom
    ];

    racks.forEach(rack => {
      adjacentCells.forEach(cell => {
        const insideX =
          cell.x >= rack.x && cell.x < rack.x + rack.w;

        const insideY =
          cell.y >= rack.y && cell.y < rack.y + rack.h;

        if (insideX && insideY) {
          if (!found.includes(rack.rack_id)) {
            found.push(rack.rack_id);
          }
        }
      });
    });

    return {
      left: found[0] || null,
      right: found[1] || null,
    };
  };

  return (
    <div style={{ padding: "20px", background: "#0f172a", minHeight: "100%" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent:"center", gap: "10px", marginBottom: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>

        <div>
          <label style={labelStyle}>Store Length (ft)</label>
          <input ref={lengthRef} defaultValue={storeArea.lengthFt} style={inputStyle} />
        </div>

        <div style={{marginRight : "20px"}}>
          <label style={labelStyle}>Store Width (ft)</label>
          <input ref={widthRef} defaultValue={storeArea.widthFt} style={inputStyle} />
        </div>

        <button onClick={applyArea}  style={btn("#374151")}>Apply Area</button>
        <button onClick={createRack} style={btn("#2563eb")}>Add Rack</button>
        <button onClick={() => setMode("blocked")} style={btn("#dc2626")}>Add Blocked Area</button>
        <button onClick={exportJSON} style={btn("#16a34a")}>Export JSON</button>

        <label style={{ ...btn("#ea580c"), display: "inline-block" }}>
          Import JSON
          <input type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
        </label>

        <button onClick={() => setMode("aisle_marker")} style={btn("#4f46e5")}>
          Add Aisle Marker
        </button>

        <button
          onClick={() => setShowWalkable((s) => !s)}
          style={btn(showWalkable ? "#0891b2" : "#4b5563")}
        >
          {showWalkable ? "Hide Walkable" : "Toggle Walkable"}
        </button>
      </div>


      <GridCanvas
        grid={gridSize}
        elements={elements}
        selectedId={selected}
        mode={mode}
        modalOpen={showModal}
        onAddBlockedArea={(blk) => {
          setElements((prev) => [...prev, blk]);
          setMode("rack");
        }}
        onUpdateElement={updateElement}
        onUpdateRack={updateRack}
        showWalkable={showWalkable}
        onSelectRack={(id) => {
          const rack = elements.find(
            (el) => el.type === "rack" && el.rack_id === id
          );
          setEditing(rack);
          setSelected(id);
          setShowModal(true);
        }}
        onSelectElement={(el) => {

          // CREATE NEW AISLE
          if (el.type === "aisle_marker" && el.new) {
            const nearest = getAdjacentRacks(el.x, el.y);

            setEditingAisle({
              aisle_name: "",
              x: el.x,
              y: el.y,
              left_rack_id: nearest.left,
              right_rack_id: nearest.right,
            });
            return;
          }

          // JUST SELECT (single click)
          if (el.selectOnly) {
            setSelected(el.id);
            return;
          }

          // DOUBLE CLICK → EDIT
          if (el.type === "aisle_marker") {
            setSelected(el.id);
            setEditingAisle(el);
            return;
          }

          if (el.type === "rack") {
            setEditing(el);
            setShowModal(true);
          }

          if (el.type === "blocked") {
            setEditingBlocked(el);
          }

          if (el.type === "aisle_marker") {
            setEditingAisle(el);
          }
        }}
      />

      {showModal && editing && (
        <RackModal
          initial={{
            rack_id: editing.rack_id,
            name: editing.name,
            category: editing.meta?.category ?? "",
            color: editing.meta?.color ?? "#FEE2E2",
            orientation: editing.meta?.orientation ?? "horizontal",
            facing:
              editing.meta?.facing ??
              (editing.meta?.orientation === "vertical" ? "right" : "bottom"),

            // 🔑 THIS IS THE FIX
            total_columns:
              editing.meta?.total_columns ??
              (editing.meta?.orientation === "horizontal"
                ? editing.w
                : editing.h),
          }}
          onClose={() => setShowModal(false)}
          onSave={saveMeta}
          onDelete={() => deleteRack(editing.rack_id)}
        />
      )}

      {editingBlocked && (
        <BlockedAreaModal
          initial={editingBlocked}
          onClose={() => setEditingBlocked(null)}
          onSave={(updated) => {
            setElements(prev =>
              prev.map(el => el.id === updated.id ? updated : el)
            );
            setEditingBlocked(null);
          }}
          onDelete={() => {
            setElements(prev =>
              prev.filter(el => el.id !== editingBlocked.id)
            );
            setEditingBlocked(null);
          }}
        />
      )}
      {editingAisle && (
        <AisleMarkerModal
          initial={editingAisle}
          racks={elements.filter(el => el.type === "rack")}
          onClose={() => setEditingAisle(null)}
          onSave={saveAisle}
          onDelete={() => {
            setElements(prev =>
              prev.filter(el => el.id !== editingAisle.id)
            );
            setEditingAisle(null);
          }}
        />
      )}
    </div>
  );
}

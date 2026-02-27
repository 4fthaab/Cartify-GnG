// src/components/ItemEntry.jsx
import React, { useState } from "react";
import Modal from "react-modal";
import { v4 as uuidv4 } from "uuid";

Modal.setAppElement("#root");

export default function ItemEntry({ elements = [], isOpen, onClose, onAddItem }) {
  const racks = elements.filter(el => el.type === "rack");
  const [name, setName] = useState("");
  const [rackId, setRackId] = useState("");
  const [index, setIndex] = useState("");

  const submit = () => {
    if (!name.trim()) {
      alert("Item name is required");
      return;
    }

    if (!rackId) {
      alert("Please select a rack");
      return;
    }

    const rack = racks.find((r) => r.rack_id === rackId);
    if (!rack) {
      alert("Selected rack does not exist");
      return;
    }

    const maxIndex = rack.meta?.total_columns || 0;
    const pos = Number(index);

    if (!pos || pos < 1 || pos > maxIndex) {
      alert(`Position index must be between 1 and ${maxIndex}`);
      return;
    }

    const item = {
      item_id: `ITEM-${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      rack_id: rackId,
      position_index: pos,
    };

    onAddItem(item);

    // reset & close
    setName("");
    setRackId("");
    setIndex("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="max-w-md mx-auto mt-24 bg-white p-4 rounded shadow-lg"
      overlayClassName="fixed inset-0 bg-black/40 flex justify-center items-start"
    >
      <h3 className="text-lg font-bold mb-3">Add Item Location</h3>

      {/* Item Name */}
      <label className="block mb-2">
        <div className="text-sm">Item Name</div>
        <input
          className="w-full border p-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tomato"
        />
      </label>

      {/* Rack selector */}
      <label className="block mb-2">
        <div className="text-sm">Rack</div>
        <select
          className="w-full border p-1"
          value={rackId}
          onChange={(e) => setRackId(e.target.value)}
        >
          <option value="">Select a rack</option>
          {racks.map((r) => (
            <option key={r.rack_id} value={r.rack_id}>
              {r.name} ({r.rack_id})
            </option>
          ))}
        </select>
      </label>

      {/* Position index */}
      <label className="block mb-3">
        <div className="text-sm">Position Index</div>
        <input
          type="number"
          className="w-full border p-1"
          value={index}
          onChange={(e) => setIndex(e.target.value)}
          placeholder="e.g. 14"
        />
        {rackId && (
          <div className="text-xs text-gray-500 mt-1">
            Valid range: 1 –{" "}
            {racks.find((r) => r.rack_id === rackId)?.meta?.total_columns}
          </div>
        )}
      </label>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1 border rounded"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Add Item
        </button>
      </div>
    </Modal>
  );
}

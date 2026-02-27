import React, { useState } from "react";

export default function ItemListPanel({ items, elements = [], onLocateItem }) {
  const racks = elements.filter(el => el.type === "rack");
  const [query, setQuery] = useState("");

  const rackName = (rackId) => {
    const rack = racks.find((r) => r.rack_id === rackId);
    return rack ? rack.name : "Unknown Rack";
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mt-6 max-w-xl">
      <h3 className="text-lg font-bold mb-2">Items</h3>

      <input
        className="w-full border p-1 mb-3"
        placeholder="Search item..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-500">No matching items.</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1 text-left">Item</th>
              <th className="border p-1 text-left">Rack</th>
              <th className="border p-1 text-left">Pos</th>
              <th className="border p-1 text-center">Locate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.item_id}>
                <td className="border p-1">{item.name}</td>
                <td className="border p-1">
                  {rackName(item.rack_id)}
                </td>
                <td className="border p-1 text-center">
                  {item.position_index}
                </td>
                <td className="border p-1 text-center">
                  <button
                    onClick={() => onLocateItem(item)}
                    className="text-blue-600 underline"
                  >
                    🔍
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

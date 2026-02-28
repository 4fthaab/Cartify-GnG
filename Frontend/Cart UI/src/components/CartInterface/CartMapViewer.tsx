import React, { useEffect, useState } from "react";
import GridCanvas from "../mapeditor/GridCanvas";
import layoutData from "../../data/ST001.json";

export default function CartMapViewer({ highlightedItem }: any) {
  const [elements, setElements] = useState<any[]>([]);
  const [gridSize, setGridSize] = useState<any>(null);

  useEffect(() => {
    const FEET_PER_CELL = layoutData.floor_area.feet_per_cell;

    const computedGrid = {
      length: Math.ceil(layoutData.floor_area.length_ft / FEET_PER_CELL),
      width: Math.ceil(layoutData.floor_area.width_ft / FEET_PER_CELL),
    };

    setGridSize(computedGrid);
    setElements(layoutData.elements);
  }, []);

  if (!gridSize) return null;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <GridCanvas
        grid={gridSize}
        elements={elements}
        mode="view"
        modalOpen={false}
        showWalkable={false}
        selectedId={null}
        highlightedItem={highlightedItem}
        onUpdateRack={() => {}}
        onUpdateElement={() => {}}
        onAddBlockedArea={() => {}}
        onSelectRack={() => {}}
        onSelectElement={() => {}}
      />
    </div>
  );
}
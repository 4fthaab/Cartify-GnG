// src/components/GridCanvas.jsx
import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Group, Text, Circle } from "react-konva";


export default function GridCanvas({
  grid,
  elements = [],
  onUpdateRack,
  mode,
  onAddBlockedArea,
  modalOpen,
  onUpdateElement,
  onSelectRack,
  showWalkable,
  onSelectElement,
  selectedId,
  highlightedItem,
}) {
  const racks = elements.filter(el => el.type === "rack");
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({
    width: 800,
    height: 600,
    cellPx: 20,
  });

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;

      // Fit grid width exactly into container width
      const cellPx = containerWidth / grid.length;
      const stageHeight = grid.width * cellPx;

      setStageSize({
        width: containerWidth,
        height: stageHeight,
        cellPx,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [grid.length, grid.width]);

  const toPx = (cells) => cells * stageSize.cellPx;

  const drawFacingBorders = (rack, pxW, pxH, isSelected) => {
    const facing = rack.meta?.facing;
    const thick = 4;
    const thin = 1;
    const color = isSelected ? "#000" : "#555";

    return (
      <>
        {/* Top */}
        <Rect
          x={0}
          y={0}
          width={pxW}
          height={facing === "top" ? thick : thin}
          fill={color}
        />

        {/* Bottom */}
        <Rect
          x={0}
          y={pxH - (facing === "bottom" ? thick : thin)}
          width={pxW}
          height={facing === "bottom" ? thick : thin}
          fill={color}
        />

        {/* Left */}
        <Rect
          x={0}
          y={0}
          width={facing === "left" ? thick : thin}
          height={pxH}
          fill={color}
        />

        {/* Right */}
        <Rect
          x={pxW - (facing === "right" ? thick : thin)}
          y={0}
          width={facing === "right" ? thick : thin}
          height={pxH}
          fill={color}
        />
      </>
    );
  };

  const walkableGrid = null;
  const handleStageClick = (e) => {
    if (modalOpen) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const x = Math.floor(pos.x / stageSize.cellPx);
    const y = Math.floor(pos.y / stageSize.cellPx);

    // BLOCKED
    if (mode === "blocked") {
      onAddBlockedArea({
        id: `blk-${Date.now()}`,
        type: "blocked",
        label: "Blocked",
        zoneType: "wall",
        x,
        y,
        w: 1,
        h: 1,
      });
      return;
    }

    // AISLE MARKER
    if (mode === "aisle_marker") {
      onSelectElement({
        type: "aisle_marker",
        x,
        y,
        new: true,
      });
      return;
    }
  };

  const getItemHighlightPoint = (item, racks) => {
    if (!item) return null;

    const rack = racks.find((r) => r.rack_id === item.rack_id);
    if (!rack) return null;

    const orientation = rack.meta?.orientation || "horizontal";
    const facing = rack.meta?.facing || (orientation === "vertical" ? "right" : "bottom");
    const total_columns = rack.meta?.total_columns || rack.w || rack.h;

    const index = item.position_index;

    if (index < 1 || index > total_columns) return null;

    if (orientation === "horizontal") {
      const x =
        rack.x +
        ((index - 0.5) / total_columns) * rack.w;
      const y =
        rack.y + (facing === "bottom" ? rack.h : 0);
      return { x, y };
    } else {
      const x =
        rack.x + (facing === "right" ? rack.w : 0);
      const y =
        rack.y +
        ((index - 0.5) / total_columns) * rack.h;
      return { x, y };
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background: "#fafafa",
        border: "1px solid #ddd",
      }}
    >
      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} onMouseDown={handleStageClick}>
        <Layer>
          {/* Grid vertical lines */}
          {Array.from({ length: grid.length + 1 }).map((_, i) => (
            <Rect
              key={`v-${i}`}
              x={toPx(i)}
              y={0}
              width={1}
              height={toPx(grid.width)}
              fill="#eee"
            />
          ))}

          {/* Grid horizontal lines */}
          {Array.from({ length: grid.width + 1 }).map((_, j) => (
            <Rect
              key={`h-${j}`}
              x={0}
              y={toPx(j)}
              width={toPx(grid.length)}
              height={1}
              fill="#eee"
            />
          ))}

          {/*walkableGrid &&
            walkableGrid.map((row, y) =>
              row.map((cell, x) =>
                cell ? null : (
                  <Rect
                    key={`nw-${x}-${y}`}
                    x={toPx(x)}
                    y={toPx(y)}
                    width={toPx(1)}
                    height={toPx(1)}
                    fill="rgba(0, 0, 0, 0.9)"
                  />
                )
              )
            )*/}
          {/* Racks */}
          {racks.map((rack) => {
            const pxX = toPx(rack.x);
            const pxY = toPx(rack.y);
            const pxW = toPx(rack.w);
            const pxH = toPx(rack.h);
            const isSelected = rack.rack_id === selectedId;

            return (
              <Group
                key={rack.rack_id}
                x={pxX}
                y={pxY}
                draggable
                onClick={() => onSelectRack(rack.rack_id)}
                onDragEnd={(e) => {
                  const newX = Math.round(e.target.x() / stageSize.cellPx);
                  const newY = Math.round(e.target.y() / stageSize.cellPx);
                  onUpdateRack({ ...rack, x: newX, y: newY });
                }}
              >
                {/* Rack body */}
                <Rect
                  width={pxW}
                  height={pxH}
                  fill={rack.meta?.color || "#ffdede"}
                  opacity={0.9}
                  cornerRadius={3}
                />

                {/* Facing indicator */}
                {drawFacingBorders(rack, pxW, pxH, isSelected)}

                {/* Rack label */}
                {(() => {
                  const isVertical = rack.meta?.orientation === "vertical";

                  return (
                    <Text
                      text={rack.name}
                      fill="#111"
                      fontSize={Math.max(10, stageSize.cellPx / 2.5)}
                      rotation={isVertical ? -90 : 0}           // 🔄 rotate vertical racks
                      x={isVertical ? pxW / 2 : 8}              // 📍 center horizontally
                      y={isVertical ? pxH / 2 : pxH / 2}        // 📍 center vertically
                      offsetX={isVertical ? 0 : 0}
                      offsetY={isVertical ? 0 : 0}
                      align="center"
                      verticalAlign="middle"
                    />
                  );
                })()}
              </Group>
            );
          })}

          {elements
            .filter(el => el.type === "blocked")
            .map((blk) => {
              const pxX = toPx(blk.x);
              const pxY = toPx(blk.y);
              const pxW = toPx(blk.w);
              const pxH = toPx(blk.h);

              const colorMap = {
                wall: "#7f1d1d",
                billing: "#0f766e",
                entry: "#2563eb",
                restricted: "#6b7280",
              };

              return (
                <Group
                  key={blk.id}
                  x={pxX}
                  y={pxY}
                  draggable
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelectElement(blk);
                  }}
                  onDragEnd={(e) => {
                    const newX = Math.round(e.target.x() / stageSize.cellPx);
                    const newY = Math.round(e.target.y() / stageSize.cellPx);
                    onUpdateElement({ ...blk, x: newX, y: newY });
                  }}
                >
                  <Rect
                    width={pxW}
                    height={pxH}
                    fill={colorMap[blk.zoneType] || "#7f1d1d"}
                    opacity={0.6}
                    cornerRadius={4}
                  />

                  <Text
                    text={blk.label || "Blocked"}
                    width={pxW}
                    height={pxH}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.max(10, stageSize.cellPx / 2.5)}
                    fill="#ffffff"
                    listening={false}   // 👈 IMPORTANT: text won’t block drag
                    opacity={0.9}
                  />
                </Group>
              );
            })
          }
          {elements
            .filter(el => el.type === "aisle_marker")
            .map((am) => {
              const pxX = toPx(am.x);
              const pxY = toPx(am.y);
              const size = stageSize.cellPx;

              return (
                <Group
                  key={`aisle-${am.id}`}
                  x={pxX}
                  y={pxY}
                  draggable
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelectElement({ ...am, selectOnly: true });
                  }}
                  onDblClick={(e) => {
                    e.cancelBubble = true;
                    onSelectElement(am); // open modal
                  }}
                  onDragEnd={(e) => {
                    const newX = Math.round(e.target.x() / stageSize.cellPx);
                    const newY = Math.round(e.target.y() / stageSize.cellPx);

                    const updated = { ...am, x: newX, y: newY };

                    onUpdateElement(updated);
                  }}
                >
                  {/* ID Label Above */}
                  <Text
                    text={String(am.id)}
                    x={0}
                    y={-stageSize.cellPx * -0.25}
                    width={size}
                    align="center"
                    fontSize={Math.max(10, stageSize.cellPx / 2.5)}
                    fill="#111"
                    listening={false}
                  />

                  {/* Marker Block */}
                  <Rect
                    width={size}
                    height={size}
                    fill="#4f46e5"
                    opacity={0.7}
                    cornerRadius={2}
                  />
                </Group>
              );
            })}
          {highlightedItem && (() => {
            const p = getItemHighlightPoint(highlightedItem, racks);
            if (!p) return null;

            return (
              <Circle
                x={toPx(p.x)}
                y={toPx(p.y)}
                radius={5}
                fill="red"
              />
            );
          })()}
        </Layer>
      </Stage>
    </div>
  );
}

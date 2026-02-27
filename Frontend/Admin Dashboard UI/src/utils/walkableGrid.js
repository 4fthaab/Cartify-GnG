export function buildWalkableGrid(grid, elements) {
  const walkable = Array.from({ length: grid.width }, () =>
    Array.from({ length: grid.length }, () => true)
  );

  elements.forEach((el) => {
    // 🚫 RACKS are always non-walkable
    if (el.type === "rack") {
      for (let y = el.y; y < el.y + el.h; y++) {
        for (let x = el.x; x < el.x + el.w; x++) {
          if (walkable[y] && walkable[y][x] !== undefined) {
            walkable[y][x] = false;
          }
        }
      }
    }

    // 🚫 Some blocked zones are non-walkable
    if (
      el.type === "blocked" &&
      (el.zoneType === "wall" || el.zoneType === "restricted")
    ) {
      for (let y = el.y; y < el.y + el.h; y++) {
        for (let x = el.x; x < el.x + el.w; x++) {
          if (walkable[y] && walkable[y][x] !== undefined) {
            walkable[y][x] = false;
          }
        }
      }
    }

    // ✅ entry & billing are left walkable intentionally
  });

  return walkable;
}

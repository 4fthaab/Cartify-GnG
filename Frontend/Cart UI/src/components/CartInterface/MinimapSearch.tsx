import { Search, ChevronRight, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BASE_URL, CART_ID, STORE_ID } from "@/config";

//  Utility: Compute Exact Pickup Point 
const computePickupPoint = (rackId: string, positionIndex: number, layout: any) => {
  const rack = layout.elements.find((e: any) => e.type === "rack" && e.rack_id === rackId);
  if (!rack) return null;

  const orientation = rack.meta?.orientation || "horizontal";
  const facing = rack.meta?.facing || "bottom";
  let px = rack.x, py = rack.y;

  if (orientation === "vertical") {
    py = rack.y + (positionIndex - 1);
    if (facing === "right") px = rack.x + (rack.w || 1);
    else px = rack.x - 1;
  } else {
    px = rack.x + (positionIndex - 1);
    if (facing === "top") py = rack.y - 1;
    else py = rack.y + (rack.h || 1);
  }
  return { x: px, y: py };
};

//  Utility: BFS Pathfinding (Walkable Grid)
function findWalkablePath(layout: any, points: { x: number; y: number }[]) {
  if (!layout || !points || points.length < 2) return [];

  const cols = layout.floor_area.length_ft / layout.floor_area.feet_per_cell;
  const rows = layout.floor_area.width_ft / layout.floor_area.feet_per_cell;

  // 1 = Walkable, 0 = Blocked
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));

  layout.elements.forEach((el: any) => {
    if (el.type === "rack" || (el.type === "blocked" && ["wall", "restricted"].includes(el.zoneType))) {
      for (let dy = 0; dy < (el.h || 1); dy++) {
        for (let dx = 0; dx < (el.w || 1); dx++) {
          if (grid[el.y + dy] && grid[el.y + dy][el.x + dx] !== undefined) {
            grid[el.y + dy][el.x + dx] = 0;
          }
        }
      }
    }
  });

  const bfs = (start: { x: number; y: number }, goal: { x: number; y: number }) => {
    const queue = [[start]];
    const visited = new Set([`${start.x},${start.y}`]);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const curr = path[path.length - 1];

      if (curr.x === goal.x && curr.y === goal.y) return path;

      for (const [dx, dy] of dirs) {
        const nx = curr.x + dx, ny = curr.y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 1 && !visited.has(`${nx},${ny}`)) {
          visited.add(`${nx},${ny}`);
          queue.push([...path, { x: nx, y: ny }]);
        }
      }
    }
    return [start, goal]; // Fallback to straight line if trapped
  };

  let fullPath: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const segment = bfs(points[i], points[i + 1]);
    fullPath = fullPath.concat(i === 0 ? segment : segment.slice(1));
  }
  return fullPath;
}

//  Map Component
const LargeDynamicStoreMap = ({ layout, cartDisplay, highlightedItem, optimizedPath }: any) => {
  if (!layout) return <div className="h-full flex items-center justify-center text-slate-400">Loading Map...</div>;

  const cols = layout.floor_area.length_ft / layout.floor_area.feet_per_cell;
  const rows = layout.floor_area.width_ft / layout.floor_area.feet_per_cell;
  const CELL = 30; // Scale factor for the SVG

  const entryNode = layout.elements.find((e: any) => e.zoneType === "entry");
  const billingNode = layout.elements.find((e: any) => e.zoneType === "billing");

  //  Force coordinates to be integers (Math.round) so the BFS Grid doesn't break
  const effectiveCartLocation = cartDisplay?.current_location
    ? { x: Math.round(cartDisplay.current_location.x), y: Math.round(cartDisplay.current_location.y) }
    : (entryNode ? { x: entryNode.x + Math.floor(entryNode.w / 2), y: entryNode.y } : null);

  // FIX: Safely determine the active path (handling empty array [] bug)
  const scannedItemIds = new Set(cartDisplay?.items?.map((i: any) => i.item_id) || []);
  const backendPath = cartDisplay?.optimized_path || [];
  const activePathArray = backendPath.length > 0 ? backendPath : (optimizedPath || []);

  const pendingOptimizedPath = activePathArray.filter((op: any) => !scannedItemIds.has(op.item_id));

  // 1. Compute Full Shopping List Route (Blue Line) - Starts from Cart!
  const listRoutePoints: any[] = [];
  if (pendingOptimizedPath.length > 0 || activePathArray.length > 0) {
    if (effectiveCartLocation) listRoutePoints.push(effectiveCartLocation); // Start at cart
    pendingOptimizedPath.forEach((op: any) => { if (op.pickup_point) listRoutePoints.push(op.pickup_point); });
    if (billingNode) listRoutePoints.push({ x: billingNode.x + Math.floor(billingNode.w / 2), y: billingNode.y }); // End at billing
  }
  const mainPathLines = findWalkablePath(layout, listRoutePoints);

  // 2. Compute Searched Item Route (Red Line / Detour)
  let searchTargetPoint = null;
  let searchPathLines: any[] = [];

  if (highlightedItem) {
    searchTargetPoint = computePickupPoint(highlightedItem.rack_id, highlightedItem.position_index, layout);

    if (searchTargetPoint && effectiveCartLocation) {
      // Default to branching from the cart's current location
      let branchPoint = effectiveCartLocation;

      // If an optimized path exists, find the closest point on that path to branch off from
      if (mainPathLines && mainPathLines.length > 0) {
        let minDistance = Infinity;

        for (const pt of mainPathLines) {
          // Calculate Manhattan distance between the path node and the target item
          const dist = Math.abs(pt.x - searchTargetPoint.x) + Math.abs(pt.y - searchTargetPoint.y);
          if (dist < minDistance) {
            minDistance = dist;
            branchPoint = pt;
          }
        }
      }

      // Draw the path from the closest point on the blue line (or the cart) to the item
      searchPathLines = findWalkablePath(layout, [branchPoint, searchTargetPoint]);
    }
  }

  return (
    <div className="w-full h-full bg-slate-100 rounded-2xl border border-slate-300 shadow-inner overflow-auto flex items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${cols * CELL} ${rows * CELL}`}
        className="w-full h-full max-w-5xl drop-shadow-md"
        style={{ backgroundColor: "#f8fafc" }}
      >
        {/* Grid Background */}
        <defs>
          <pattern id="grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Full Shopping List Path Line (Blue) */}
        {mainPathLines.length > 1 && (
          <polyline
            points={mainPathLines.map((p: any) => `${p.x * CELL + (CELL / 2)},${p.y * CELL + (CELL / 2)}`).join(" ")}
            fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 10"
            className="opacity-70 animate-[dash_1.5s_linear_infinite]"
          />
        )}

        {/* Searched Item Path Line (Red/Orange) */}
        {searchPathLines.length > 1 && (
          <polyline
            points={searchPathLines.map((p: any) => `${p.x * CELL + (CELL / 2)},${p.y * CELL + (CELL / 2)}`).join(" ")}
            fill="none" stroke="#f97316" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8"
            className="animate-[dash_1s_linear_infinite]"
          />
        )}
        <style>{`@keyframes dash { to { stroke-dashoffset: -20; } }`}</style>

        {/* Store Elements */}
        {layout.elements.map((el: any) => {
          if (el.type === "aisle_marker") return null;

          const isRack = el.type === "rack";
          const bgColor = isRack ? (el.meta?.color || "#cbd5e1") :
            el.zoneType === "wall" ? "#94a3b8" :
              el.zoneType === "entry" ? "#bfdbfe" :
                el.zoneType === "billing" ? "#bbf7d0" : "#e2e8f0";

          let facingLine = null;
          if (isRack) {
            const facing = el.meta?.facing || "bottom";
            const wPx = (el.w || 1) * CELL;
            const hPx = (el.h || 1) * CELL;
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

            if (facing === "top") { x2 = wPx; }
            else if (facing === "bottom") { y1 = hPx; y2 = hPx; x2 = wPx; }
            else if (facing === "left") { y2 = hPx; }
            else if (facing === "right") { x1 = wPx; x2 = wPx; y2 = hPx; }

            facingLine = <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="5" />;
          }

          return (
            <g key={el.id || el.rack_id} transform={`translate(${el.x * CELL}, ${el.y * CELL})`}>
              <rect width={(el.w || 1) * CELL} height={(el.h || 1) * CELL} fill={bgColor} rx={isRack ? 4 : 0} />
              {facingLine}
              <text
                x={(el.w || 1) * CELL / 2}
                y={(el.h || 1) * CELL / 2}
                fill={el.zoneType === "wall" || el.zoneType === "restricted" ? "#ffffff" : "#1e293b"}
                fontSize={isRack ? "10px" : "12px"}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={el.meta?.orientation === "vertical" ? `rotate(-90, ${(el.w || 1) * CELL / 2}, ${(el.h || 1) * CELL / 2})` : ""}
              >
                {el.name || el.label}
              </text>
            </g>
          );
        })}

        {/*  Simple Dots with Directional "Stubs" to the Rack  */}
        {pendingOptimizedPath.map((op: any, idx: number) => {
          if (!op.pickup_point) return null;

          const cx = op.pickup_point.x * CELL + CELL / 2;
          const cy = op.pickup_point.y * CELL + CELL / 2;

          // Find the rack to determine which direction the item is facing
          const rack = layout.elements.find((e: any) => e.type === "rack" && e.rack_id === op.rack_id);
          let dx = 0, dy = 0;

          if (rack) {
            const facing = rack.meta?.facing || "bottom";
            // If the rack faces right, the aisle is on its right, so point LEFT (-x) to the rack
            if (facing === "right") dx = -CELL / 2;
            else if (facing === "left") dx = CELL / 2;
            else if (facing === "top") dy = CELL / 2;
            else if (facing === "bottom") dy = -CELL / 2;
          }

          return (
            <g key={`badge-${idx}`}>
              {/* Draw the pointer stub first so it sits under the dot */}
              {rack && (
                <line x1={cx} y1={cy} x2={cx + dx} y2={cy + dy} stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
              )}
              {/* The pickup dot */}
              <circle cx={cx} cy={cy} r="5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
            </g>
          );
        })}

        {/*  Searched Item Target Marker with Pointer Stub  */}
        {searchTargetPoint && (() => {
          const cx = searchTargetPoint.x * CELL + CELL / 2;
          const cy = searchTargetPoint.y * CELL + CELL / 2;

          const rack = layout.elements.find((e: any) => e.type === "rack" && e.rack_id === highlightedItem?.rack_id);
          let dx = 0, dy = 0;

          if (rack) {
            const facing = rack.meta?.facing || "bottom";
            if (facing === "right") dx = -CELL / 2;
            else if (facing === "left") dx = CELL / 2;
            else if (facing === "top") dy = CELL / 2;
            else if (facing === "bottom") dy = -CELL / 2;
          }

          return (
            <g>
              {/* Draw the orange pointer stub */}
              {rack && (
                <line x1={cx} y1={cy} x2={cx + dx} y2={cy + dy} stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
              )}
              {/* The pulsing target dots */}
              <circle cx={cx} cy={cy} r="12" fill="#f97316" className="animate-pulse opacity-50" />
              <circle cx={cx} cy={cy} r="6" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
            </g>
          );
        })()}

        {/* Live Cart Location Marker */}
        {effectiveCartLocation && (
          <g transform={`translate(${effectiveCartLocation.x * CELL + CELL / 2}, ${effectiveCartLocation.y * CELL + CELL / 2})`}>
            <circle r="14" fill="#3b82f6" className="animate-ping opacity-40" />
            <circle r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};


//  Main Interface  
export const MinimapSearch = ({ onNext }: { onNext: (itemName?: string) => void }) => {
  const [layout, setLayout] = useState<any>(null);
  const [inventoryDB, setInventoryDB] = useState<any[]>([]);
  const [cartDisplay, setCartDisplay] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [highlightedItem, setHighlightedItem] = useState<any>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  //   Add state for User ID and Optimized Path 
  const [userId, setUserId] = useState<string | null>(null);
  const [optimizedPath, setOptimizedPath] = useState<any[]>([]);

  //  Read User ID from LocalStorage 
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_user");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.user_id) setUserId(p.user_id);
      }
    } catch { /* guest */ }
  }, []);

  //  Fetch Optimized Path from Backend 
  //   Dynamically sync User ID 
  useEffect(() => {
    const syncUser = () => {
      // Prefer the backend's source of truth if a list is linked
      if (cartDisplay?.linked_user_id) {
        setUserId(cartDisplay.linked_user_id);
        return;
      }
      // Fallback to local storage (e.g. right after login)
      try {
        const raw = localStorage.getItem("cart_user");
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.user_id && p.user_id !== userId) setUserId(p.user_id);
        }
      } catch { /* guest */ }
    };

    syncUser(); // Check immediately
    const interval = setInterval(syncUser, 1500); // Check periodically
    return () => clearInterval(interval);
  }, [cartDisplay?.linked_user_id, userId]);


  //  Clear stale path if the user switches lists 
  useEffect(() => {
    setOptimizedPath([]); // Reset local path whenever the linked list ID changes
  }, [cartDisplay?.linked_list_id]);


  //   Continuously fetch Optimized Path until found
  useEffect(() => {
    const hasBackendPath = cartDisplay?.optimized_path && cartDisplay.optimized_path.length > 0;
    const hasLocalPath = optimizedPath && optimizedPath.length > 0;

    // If we already have the path (from either source), do nothing / stop polling.
    if (hasBackendPath || hasLocalPath) return;

    // Only start polling if we know who the user is and what list they are using
    if (userId && cartDisplay?.linked_list_id) {
      const fetchOptimizedPath = async () => {
        try {
          const res = await fetch(`${BASE_URL}/path/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              store_id: STORE_ID,
              list_id: cartDisplay.linked_list_id
            }),
          });
          const data = await res.json();

          // Only update state if it actually gave us a valid path array
          if (data.optimized_path && data.optimized_path.length > 0) {
            setOptimizedPath(data.optimized_path);
          }
        } catch (e) {
          console.error("Waiting for path generation...", e);
        }
      };

      // Try fetching immediately, then keep trying every 1.5 seconds
      fetchOptimizedPath();
      const intervalId = setInterval(fetchOptimizedPath, 1500);

      // Cleanup interval when component unmounts or dependencies change
      return () => clearInterval(intervalId);
    }
  }, [userId, cartDisplay?.linked_list_id, cartDisplay?.optimized_path, optimizedPath]);

  // 1. Fetch Store Layout & All Items
  useEffect(() => {
    fetch(`${BASE_URL}/store/layout/${STORE_ID}`)
      .then(res => res.json())
      .then(data => setLayout(data))
      .catch(e => console.error("Failed to fetch layout:", e));

    fetch(`${BASE_URL}/store/items/${STORE_ID}`)
      .then(res => res.json())
      .then(data => setInventoryDB(data.items || []))
      .catch(e => console.error("Failed to fetch items:", e));
  }, []);

  // 2. Poll /cart/display to get LIVE location AND the Optimized List Path
  useEffect(() => {
    const fetchCartDisplay = async () => {
      try {
        const res = await fetch(`${BASE_URL}/cart/display/${CART_ID}`);
        const data = await res.json();
        setCartDisplay(data);
      } catch (e) {
        console.error("Cart display sync failed:", e);
      }
    };

    fetchCartDisplay();
    const id = setInterval(fetchCartDisplay, 2500); // Poll every 2.5s
    return () => clearInterval(id);
  }, []);

  // Search Logic (Now using live backend data)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const matches = inventoryDB.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      (item.label_variants || []).some((v: string) => v.toLowerCase().includes(value.toLowerCase()))
    );
    setSuggestions(matches);
  };

  const handleSuggestionSelect = (item: any) => {
    setSearchQuery(item.name);
    setSuggestions([]);
    setHighlightedItem({
      name: item.name,
      rack_id: item.rack_id,
      position_index: item.position_index,
    });

    setTimeout(() => {
      setSearchQuery("");
      setShowAddItemDialog(true);
    }, 3000);
  };

  //  Add Item to List & Recalculate Path 
  const handleAddToList = async () => {
    if (!userId || !cartDisplay?.linked_list_id || !highlightedItem) return;

    setIsAdding(true);
    try {
      // 1. Add the item to the backend list (FIXED PAYLOAD)
      await fetch(`${BASE_URL}/shopping-list/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          list_id: cartDisplay.linked_list_id,
          item_name: highlightedItem.name 
        }),
      });

      // 2. Force the backend to sync the updated list with the active cart.
      // This automatically recalculates the A* path and updates the cart DB
      await fetch(`${BASE_URL}/shopping-list/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          list_id: cartDisplay.linked_list_id,
          cart_id: CART_ID
        }),
      });

       
      

      // 3. Clear the search and the orange detour highlight
      const addedItemName = highlightedItem.name;
      setHighlightedItem(null);
      setSearchQuery("");
      setShowAddItemDialog(false);

      onNext(addedItemName);

    } catch (e) {
      console.error("Failed to add item and recalculate path:", e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="ml-4">
              <h2 className="text-3xl font-bold text-slate-800">Store Navigator</h2>
              <p className="text-slate-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Live location & Pathfinding
              </p>
            </div>
          </div>
          <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
            Shopping List & Cart <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-xl mx-auto w-full z-20">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search items to locate..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12 h-14 text-lg border-2 border-slate-200 focus:border-blue-500 bg-white rounded-xl shadow-sm w-full"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 max-h-48 overflow-y-auto border border-slate-200">
              {suggestions.map((item) => (
                <div key={item.item_id} onClick={() => handleSuggestionSelect(item)} className="cursor-pointer p-3 hover:bg-slate-100 flex justify-between items-center border-b last:border-0">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">{item.rack_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Large Map Area */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 border border-slate-200 relative">
          <LargeDynamicStoreMap
            layout={layout}
            cartDisplay={cartDisplay}     // Pass the whole object to check scanned items
            optimizedPath={optimizedPath} // Fallback path
            highlightedItem={highlightedItem}
          />
        </div>
      </div>
      {/* Item Add Confirmation Dialog */}
      <AlertDialog
        open={showAddItemDialog}
        onOpenChange={(open) => {
          setShowAddItemDialog(open);
          if (!open) setHighlightedItem(null); // Clear item if they close manually
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add to Shopping List?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add <strong>{highlightedItem?.name}</strong> to your current shopping list?
              This will update your optimized route.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setHighlightedItem(null)}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
              disabled={isAdding}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAddToList();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white min-w-[120px]"
              disabled={isAdding}
            >
              {isAdding ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </div>
              ) : (
                "Yes, Add Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, List, MapPin, Search, X, AlertCircle,
  CheckCircle2, ArrowRight, ChevronLeft, Loader2, RefreshCw, Gift, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BASE_URL, CART_ID, STORE_ID } from "@/config";

const POLL_MS = 2500;

// ─── Utility: BFS Pathfinding (Walkable Grid) ────────────────────────────────
function findWalkablePath(layout: any, points: { x: number; y: number }[]) {
  if (!layout || !points || points.length < 2) return [];

  const cols = layout.floor_area.length_ft / layout.floor_area.feet_per_cell;
  const rows = layout.floor_area.width_ft / layout.floor_area.feet_per_cell;
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
    const visited = new Set([`${Math.round(start.x)},${Math.round(start.y)}`]);
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
    return [start, goal];
  };

  let fullPath: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const segment = bfs(
      { x: Math.round(points[i].x), y: Math.round(points[i].y) },
      { x: Math.round(points[i + 1].x), y: Math.round(points[i + 1].y) }
    );
    fullPath = fullPath.concat(i === 0 ? segment : segment.slice(1));
  }
  return fullPath;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ListItem { name: string; bought: boolean; }
interface CartItem { item_id: string; name: string; weight_g: number; price: number; qty: number; added_at: string; confirmed: boolean; }

interface BackendMatch {
  item_id: string; name: string; rack_id: string; rack_name?: string; position_index: number;
  category_name: string; price?: number; unit_price_per_kg?: number;
  weight_type: string; weight_g?: number; label_variants: string[];
}

interface CurrentLocation {
  x: number;
  y: number;
  marker_id?: number;
  rack_id?: string;
  nearby_racks?: string[];
  source?: string;
}

interface CartDisplay {
  cart_id: string; store_id: string; status: string;
  items: CartItem[]; total_items: number; total_price: number; total_weight: number;
  user_list_items: ListItem[]; backend_matches: BackendMatch[];
  optimized_path: { item_id: string; rack_id: string; position_index: number; pickup_point: { x: number; y: number }; }[];
  current_location?: CurrentLocation;
  list_name?: string; linked_list_id?: string; linked_user_id?: string;
}

interface AvailableList {
  list_id: string; list_name: string;
  items: { name: string; bought?: boolean }[]; status: string;
}

// ─── Store POV Map (Dynamic Database Camera & True POV) ──────────────────────
const POVStoreMap = ({
  layout,
  activePath,
  scannedItemIds,
  povState,
  cartLocation,
}: {
  layout: any;
  activePath: any[];
  scannedItemIds: Set<string>;
  povState: { racks: string[]; isHorizontal: boolean };
  cartLocation?: CurrentLocation;
}) => {
  // Wait for the dynamic layout from the DB
  if (!layout) return <div className="h-full flex items-center justify-center text-slate-400 animate-pulse">Loading Dynamic Map...</div>;

  const CELL = 40;
  const { racks, isHorizontal } = povState;

  // 1. Compute Path (Filter out items already scanned)
  const pendingOptimizedPath = activePath.filter((op: any) => !scannedItemIds.has(op.item_id));

  const entryNode = layout.elements.find((e: any) => e.zoneType === "entry");
  const billingNode = layout.elements.find((e: any) => e.zoneType === "billing");

  const effectiveCartLocation = cartLocation
    ? { x: Math.round(cartLocation.x), y: Math.round(cartLocation.y) }
    : (entryNode ? { x: entryNode.x + Math.floor(entryNode.w / 2), y: entryNode.y } : null);

  // --- FIX 2: Added Billing Node to the Path Array ---
  const listRoutePoints: any[] = [];
  if (pendingOptimizedPath.length > 0 || activePath.length > 0) {
    if (effectiveCartLocation) listRoutePoints.push(effectiveCartLocation); // Start at cart
    pendingOptimizedPath.forEach((op: any) => { if (op.pickup_point) listRoutePoints.push(op.pickup_point); });

    // Add the checkout/billing point to the end of the route
    if (billingNode) {
      listRoutePoints.push({ x: billingNode.x + Math.floor((billingNode.w || 1) / 2), y: billingNode.y });
    }
  }
  const mainPathLines = findWalkablePath(layout, listRoutePoints);

  // --- FIX 1: True POV Camera Rotation ---
  // Find where the user is heading next
  const nextPt = pendingOptimizedPath.length > 0
    ? pendingOptimizedPath[0].pickup_point
    : (billingNode ? { x: billingNode.x + Math.floor((billingNode.w || 1) / 2), y: billingNode.y } : null);

  let rotationAngle = isHorizontal ? -90 : 0; // Default fallback rotations

  if (effectiveCartLocation && nextPt) {
    if (isHorizontal) {
      // If moving Left (-x) -> rotate 90. If moving Right (+x) -> rotate -90.
      if (nextPt.x < effectiveCartLocation.x - 0.5) rotationAngle = 90;
      else if (nextPt.x > effectiveCartLocation.x + 0.5) rotationAngle = -90;
    } else {
      // If moving Down (+y) -> rotate 180. If moving Up (-y) -> rotate 0.
      if (nextPt.y > effectiveCartLocation.y + 0.5) rotationAngle = 180;
      else if (nextPt.y < effectiveCartLocation.y - 0.5) rotationAngle = 0;
    }
  }

  // Swap Width/Height of the viewBox if the camera is rotated sideways
  const isViewRotated = Math.abs(rotationAngle) === 90;

  // 2. Determine Camera Bounding Box using DYNAMIC layout elements
  const allRacks = layout.elements.filter((e: any) => e.type === "rack");
  const activeRacks = allRacks.filter((r: any) => racks.includes(r.rack_id));

  let minX = 0, maxX = 25, minY = 0, maxY = 10;
  if (activeRacks.length > 0) {
    minX = Math.min(...activeRacks.map((r: any) => r.x)) - 2;
    maxX = Math.max(...activeRacks.map((r: any) => r.x + (r.w || 1))) + 2;
    minY = Math.min(...activeRacks.map((r: any) => r.y)) - 2;
    maxY = Math.max(...activeRacks.map((r: any) => r.y + (r.h || 1))) + 2;
  }

  let vW = maxX - minX;
  let vH = maxY - minY;
  if (vW < 8) { const diff = 8 - vW; minX -= diff / 2; maxX += diff / 2; vW = 8; }
  if (vH < 8) { const diff = 8 - vH; minY -= diff / 2; maxY += diff / 2; vH = 8; }

  // Clamp to store boundaries
  const maxCols = layout.floor_area ? layout.floor_area.length_ft / layout.floor_area.feet_per_cell : 26;
  const maxRows = layout.floor_area ? layout.floor_area.width_ft / layout.floor_area.feet_per_cell : 11;

  minX = Math.max(-1, minX); minY = Math.max(-1, minY);
  maxX = Math.min(maxCols, maxX); maxY = Math.min(maxRows, maxY);
  vW = maxX - minX; vH = maxY - minY;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Apply rotated ViewBox dimensions
  const vbW = isViewRotated ? vH : vW;
  const vbH = isViewRotated ? vW : vH;

  return (
    <div className="w-full h-full bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">
      <svg viewBox={`0 0 ${vbW * CELL} ${vbH * CELL}`} className="w-full h-full max-w-full max-h-full drop-shadow-sm">
        <defs>
          <pattern id="pov-grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>

        <g
          transform={`translate(${(vbW * CELL) / 2}, ${(vbH * CELL) / 2}) rotate(${rotationAngle}) translate(${-cx * CELL}, ${-cy * CELL})`}
          className="transition-all duration-700 ease-in-out"
        >
          {/* Background Grid */}
          <rect x={-CELL} y={-CELL} width={(maxCols + 2) * CELL} height={(maxRows + 2) * CELL} fill="url(#pov-grid)" />

          {/* 1. Full Shopping List Path Line (Blue) */}
          {mainPathLines.length > 1 && (
            <polyline
              points={mainPathLines.map((p: any) => `${p.x * CELL + (CELL / 2)},${p.y * CELL + (CELL / 2)}`).join(" ")}
              fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 12"
              className="opacity-80 animate-[dash_1.5s_linear_infinite]"
            />
          )}
          <style>{`@keyframes dash { to { stroke-dashoffset: -24; } }`}</style>

          {/* 2. Dynamic DB Store Elements (Racks, Walls, Zones) */}
          {layout.elements.map((el: any) => {
            if (el.type === "aisle_marker") return null;

            const isRack = el.type === "rack";
            const isNear = isRack && racks.includes(el.rack_id);

            // FIX: Multiply by CELL exactly once!
            const rx = el.x * CELL, ry = el.y * CELL;
            const rwPx = (el.w || 1) * CELL, rhPx = (el.h || 1) * CELL;

            // Re-add the colors for the walls and zones so the map isn't empty
            const bgColor = isRack ? (el.meta?.color || "#cbd5e1") :
              el.zoneType === "wall" ? "#94a3b8" :
                el.zoneType === "entry" ? "#bfdbfe" :
                  el.zoneType === "billing" ? "#bbf7d0" : "#e2e8f0";

            // Counter-Rotation Math: Keep text upright relative to the SCREEN!
            const isElementVerticalOnScreen = isViewRotated ? ((el.w || 1) > (el.h || 1)) : ((el.h || 1) > (el.w || 1));
            const targetScreenRot = isElementVerticalOnScreen ? -90 : 0;
            const textRot = targetScreenRot - rotationAngle;

            return (
              <g key={el.id || el.rack_id} transform={`translate(${rx}, ${ry})`}>
                <rect
                  width={rwPx} height={rhPx}
                  fill={isRack && !isNear ? bgColor + "66" : bgColor} // Dim racks we aren't near
                  rx={isRack ? 4 : 0}
                  stroke={isNear ? "#1e293b" : "none"} strokeWidth={isNear ? 2 : 0}
                  style={{ transition: "all 0.5s ease" }}
                />
                <text
                  x={rwPx / 2} y={rhPx / 2}
                  fill={el.zoneType === "wall" || el.zoneType === "restricted" ? "#ffffff" : (isNear ? "#1e293b" : "#475569")}
                  fontSize={isRack ? CELL * 0.28 : CELL * 0.35}
                  fontWeight="bold" textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${textRot}, ${rwPx / 2}, ${rhPx / 2})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {el.label || el.name}
                </text>
              </g>
            );
          })}

          {/* 3. Pointer Stubs & Dots */}
          {pendingOptimizedPath.map((op: any, idx: number) => {
            if (!op.pickup_point) return null;

            const px = op.pickup_point.x * CELL + CELL / 2;
            const py = op.pickup_point.y * CELL + CELL / 2;

            const rack = allRacks.find((e: any) => e.rack_id === op.rack_id);
            let dx = 0, dy = 0;
            if (rack) {
              const facing = rack.meta?.facing || "bottom";
              if (facing === "right") dx = -CELL / 2;
              else if (facing === "left") dx = CELL / 2;
              else if (facing === "top") dy = CELL / 2;
              else if (facing === "bottom") dy = -CELL / 2;
            }

            return (
              <g key={`badge-${idx}`}>
                {rack && <line x1={px} y1={py} x2={px + dx} y2={py + dy} stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />}
                <circle cx={px} cy={py} r="7" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
              </g>
            );
          })}

          {/* 4. Live Cart Location */}
          {effectiveCartLocation && (
            <g transform={`translate(${effectiveCartLocation.x * CELL + CELL / 2}, ${effectiveCartLocation.y * CELL + CELL / 2})`} className="transition-transform duration-500">
              <circle r={CELL * 0.5} fill="#3b82f6" className="animate-ping opacity-40" />
              <circle r={CELL * 0.3} fill="#2563eb" stroke="#ffffff" strokeWidth="3" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
// ─── Checkout Modal ─────────────────────────────────────────────────────────────

const CheckoutModal = ({
  isOpen, onClose, onConfirm, cartItems, pendingListItems, totalAmount,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  cartItems: CartItem[]; pendingListItems: ListItem[]; totalAmount: number;
}) => {
  if (!isOpen) return null;
  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ animation: "mpop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={e => e.stopPropagation()}>
        <style>{`@keyframes mpop{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        <div className="bg-gradient-to-r from-amber-200 to-orange-300 px-6 pt-6 pb-5 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/25 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Review Your Cart</h2>
              <p className="text-xs mt-0.5">Check items before proceeding to payment</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[46vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">In Your Cart ({cartItems.length})</span>
            </div>
            <div className="space-y-1.5">
              {cartItems.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No items scanned yet</p>}
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                    <span className="text-xs text-slate-400">{item.weight_g}g</span>
                  </div>
                  <span className="font-bold text-green-700 text-sm">₹{item.price?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {pendingListItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Not Yet Scanned ({pendingListItems.length})</span>
              </div>
              <div className="space-y-1.5">
                {pendingListItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-sm text-slate-500 capitalize">{item.name}</span>
                    </div>
                    <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">Not scanned</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800">Total</span>
            <span className="font-bold text-xl text-blue-600">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-5 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors text-sm">
            ← Back to Cart
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
            Confirm &amp; Pay <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
};

// ─── Main Interface ─────────────────────────────────────────────────────────────

interface MainInterfaceProps {
  onBack: () => void;
  onRouteReady?: () => void;
  onCheckout: (items: CartItem[], total: number) => void;
  isPollingPaused?: boolean;
  recentlyAddedItem?: string | null;
  clearRecentlyAdded?: () => void;
}

export const MainInterface = ({ onBack, onRouteReady, onCheckout, recentlyAddedItem, clearRecentlyAdded, isPollingPaused = false }: MainInterfaceProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);
  const [availableLists, setAvailableLists] = useState<AvailableList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectingList, setSelectingList] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [optimizedPath, setOptimizedPath] = useState<any[]>([]);
  const [backendMatchedItems, setBackendMatchedItems] = useState<any[]>([]);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [povState, setPovState] = useState<{ racks: string[], isHorizontal: boolean }>({ racks: [], isHorizontal: false });
  const [layout, setLayout] = useState<any>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/store/layout/${STORE_ID}`)
      .then(res => res.json())
      .then(data => setLayout(data))
      .catch(e => console.error("Failed to fetch layout:", e));
  }, []);

  // --- UPDATED: Continuous User Sync ---
  // Since the component never unmounts, we must actively watch localStorage
  useEffect(() => {
    const checkUser = () => {
      try {
        const raw = localStorage.getItem("cart_user");
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.user_id && p.user_id !== userId) setUserId(p.user_id);
        } else if (userId) {
          setUserId(null); // Clear state if logged out
        }
      } catch {}
    };
    
    checkUser(); // Check immediately
    const interval = setInterval(checkUser, 1000); // Check every second
    return () => clearInterval(interval);
  }, [userId]);

  // ── Poll /cart/display every POLL_MS — single source of truth
  const pollCart = useCallback(async () => {
    if (isPollingPaused) return; // <-- ADD EARLY RETURN

    try {
      // 🚨 FIX: Added ?t=${Date.now()} to completely bust the cache!
      const res = await fetch(`${BASE_URL}/cart/display/${CART_ID}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: CartDisplay = await res.json();
      if ((data as any).error) return;

      // 🚨 --- UPDATED: Detect Remote Logout --- 🚨
      const localSession = localStorage.getItem("cart_user");

      // If we have a local session, but the cart status reset to "available", 
      // it means the backend forcefully cleared the cart session!
      if (localSession && data.status === "available") {
        console.log("Remote logout detected! Resetting cart UI...");
        localStorage.removeItem("cart_user");
        window.location.reload();
        return;
      }

      // Update the main display state
      setCartDisplay(data);

      // --- Auto-sync User ID ---
      if (data.linked_user_id) {
        setUserId(prev => {
          if (prev !== data.linked_user_id) {
            localStorage.setItem("cart_user", JSON.stringify({ user_id: data.linked_user_id }));
            return data.linked_user_id;
          }
          return prev;
        });
      } else {
        setUserId(null);
        setAvailableLists([]);
      }

      // --- Auto-sync List ID ---
      if (data.linked_list_id) {
        setSelectedListId(data.linked_list_id);
      } else {
        // FIX: Do not overwrite the local state if the user explicitly chose a guest/no-list session!
        setSelectedListId((prev) => {
          if (prev === 'guest_session' || prev === 'no_list_session') {
            return prev;
          }
          return null;
        });
      }
    } catch {
      /* silent */
    }
  }, [isPollingPaused]);

  useEffect(() => {
    pollCart();
    const id = setInterval(pollCart, POLL_MS);
    return () => clearInterval(id);
  }, [pollCart]);

  // --- UPDATED: Dynamic Camera Tracking (With Entry Default) ---
  useEffect(() => {
    const loc = cartDisplay?.current_location;
    if (!layout) return; // Wait for layout to load

    const allRacks = layout.elements.filter((e: any) => e.type === "rack");
    let targetRacks: string[] = [];

    // 1. If we have a live location, use it
    if (loc) {
      if (loc.nearby_racks && loc.nearby_racks.length > 0) {
        targetRacks = loc.nearby_racks;
      } else if (loc.rack_id) {
        targetRacks = [loc.rack_id];
      }
    }

    // 2. NO LOCATION YET: Default to the Entry Zone POV
    if (targetRacks.length === 0) {
      const entry = layout.elements.find((e: any) => e.zoneType === "entry");
      if (entry) {
        // Find the closest rack to the entry doors to frame the camera correctly
        const closestRack = allRacks.reduce((closest: any, rack: any) => {
          const dist = Math.hypot(rack.x - entry.x, rack.y - entry.y);
          return (!closest || dist < closest.dist) ? { rack, dist } : closest;
        }, null)?.rack;

        if (closestRack) {
          targetRacks = [closestRack.rack_id];
        }
      }
    }

    // 3. Update the camera rotation and zoom to track the active racks
    if (targetRacks.length > 0) {
      const isHoriz = allRacks.find((r: any) => targetRacks.includes(r.rack_id))?.meta?.orientation === "horizontal";
      setPovState({ racks: targetRacks, isHorizontal: !!isHoriz });
    }
  }, [cartDisplay?.current_location, layout]);

  useEffect(() => {
    if (recentlyAddedItem && itemRefs.current[recentlyAddedItem]) {
      // Smoothly scroll the list so the new item is exactly in the center
      itemRefs.current[recentlyAddedItem]?.scrollIntoView({ behavior: "smooth", block: "center" });

      // Remove the glow after 2.5 seconds
      const timer = setTimeout(() => {
        if (clearRecentlyAdded) clearRecentlyAdded();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [recentlyAddedItem, cartDisplay]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/offers/all`);
        const data = await res.json();
        if (data.offers) setOffers(data.offers);
      } catch (e) {
        console.error("Failed to fetch offers", e);
      }
    };
    fetchOffers();
  }, []);

  // ── Fetch user's shopping lists
  const fetchLists = useCallback(async () => {
    if (!userId) return;
    setLoadingLists(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/shopping-list/get/${userId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAvailableLists((data.shopping_lists ?? []).filter((l: AvailableList) => l.status !== "completed"));
    } catch (e) {
      setError(e.message ?? "Failed to load lists");
    } finally { setLoadingLists(false); }
  }, [userId]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  // ── Link list to cart (two-step: preview → confirm)
  const handleSelectList = (listId: string) => {
    setPendingListId(listId);
  };

  const handleConfirmList = async () => {
    if (!pendingListId || !userId || !cartDisplay?.store_id) return;
    setSelectingList(pendingListId);
    setError(null);

    try {
      // 1. Confirm the list with the backend
      const res = await fetch(`${BASE_URL}/cart/confirm-list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, list_id: pendingListId, cart_id: CART_ID }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 2. Poll for the Optimized Path BEFORE navigating
      let pathReady = false;
      while (!pathReady) {
        try {
          const pathRes = await fetch(`${BASE_URL}/path/generate`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              store_id: cartDisplay.store_id,
              list_id: pendingListId
            }),
          });
          const pathData = await pathRes.json();

          if (pathData.optimized_path && pathData.optimized_path.length > 0) {
            setOptimizedPath(pathData.optimized_path);
            setBackendMatchedItems(pathData.matched_items || []);
            pathReady = true; // Break the loop!
          } else {
            // Wait 1 second and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          // If the path fetch errors, just wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 3. Finalize UI State
      setSelectedListId(pendingListId);
      setPendingListId(null);
      setShowCart(false);
      await pollCart();

      // 4. Slide to the Minimap!
      if (onRouteReady) onRouteReady();

    } catch (e: any) {
      setError(e.message ?? "Failed to confirm list");
    } finally {
      setSelectingList(null);
    }
  };

  useEffect(() => {
    if (selectedListId && userId && cartDisplay?.store_id) {
      const fetchOptimizedPath = async () => {
        try {
          const res = await fetch(`${BASE_URL}/path/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              store_id: cartDisplay.store_id,
              list_id: selectedListId
            }),
          });
          const data = await res.json();
          if (data.optimized_path) {
            setOptimizedPath(data.optimized_path);
            setBackendMatchedItems(data.matched_items || []);
          }
        } catch (e) {
          console.error("Failed to generate optimized path:", e);
        }
      };

      fetchOptimizedPath();
    }
  }, [selectedListId, userId, cartDisplay?.store_id]);

  // ── Checkout — just navigate to BillingScreen; actual /cart/checkout is called
  // from PaymentScreen once the user has selected a payment method.
  const handleCheckout = async () => {
    setShowModal(false);
    onCheckout(cartItems, totalAmount); // <-- Pass the data up!
  };

  // ── Derived state from cartDisplay
  const cartItems = cartDisplay?.items ?? [];
  const rawListItems = cartDisplay?.user_list_items ?? [];
  const backendMatches = cartDisplay?.backend_matches ?? [];
  const pendingItems = rawListItems.filter(i => !i.bought);
  const totalAmount = cartDisplay?.total_price ?? 0;
  const totalWeight = cartDisplay?.total_weight ?? 0;
  const nearbyRacks = cartDisplay?.current_location?.nearby_racks ?? [];
  const cartLocation = cartDisplay?.current_location;

  // ── Build Enriched Items and Sort via A* Path ──
  const activePath = (cartDisplay?.optimized_path && cartDisplay.optimized_path.length > 0)
    ? cartDisplay.optimized_path
    : optimizedPath;

  const orderMap = new Map(activePath.map((op, index) => [op.item_id, index]));

  const enrichedItems = rawListItems.map(li => {

    // FIX 2: Always prioritize the live backend_matches from the polling over the local state!
    const matchesToUse = (cartDisplay?.backend_matches && cartDisplay.backend_matches.length > 0)
      ? cartDisplay.backend_matches
      : backendMatchedItems;

    const q = li.name.toLowerCase().trim();

    let bestMatch = null;
    let bestScore = -1;

    // Use a localized scoring system to link the user's string to the backend's item
    for (const bmi of matchesToUse) {
      const n = bmi.name?.toLowerCase().trim() || "";
      const oq = bmi.original_query?.toLowerCase().trim() || "";

      // NEW: Filter out empty strings to prevent the .includes("") bug!
      const variants = (bmi.label_variants || [])
        .map((v: string) => v.toLowerCase().trim())
        .filter((v: string) => v.length > 0);

      let score = -1;

      // 1. Exact match (Highest Priority)
      if (n === q || oq === q || variants.includes(q)) {
        score = 3;
      }
      // 2. Prefix match
      else if (variants.some((v: string) => v.startsWith(q) || q.startsWith(v))) {
        score = 2;
      }
      // 3. Substring match
      else if (n.includes(q) || q.includes(n) || variants.some((v: string) => v.includes(q) || q.includes(v))) {
        score = 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = bmi;
      }
    }

    return {
      ...li,
      item_id: bestMatch?.item_id,
      rack_id: bestMatch?.rack_id,
      rack_name: bestMatch?.rack_name,
      position_index: bestMatch?.position_index
    };
  });

  if (activePath.length > 0) {
    enrichedItems.sort((a, b) => {
      const indexA = a.item_id && orderMap.has(a.item_id) ? orderMap.get(a.item_id)! : 9999;
      const indexB = b.item_id && orderMap.has(b.item_id) ? orderMap.get(b.item_id)! : 9999;
      return indexA - indexB;
    });
  }

  if (activePath.length > 0) {
    enrichedItems.sort((a, b) => {
      const indexA = a.item_id && orderMap.has(a.item_id) ? orderMap.get(a.item_id)! : 9999;
      const indexB = b.item_id && orderMap.has(b.item_id) ? orderMap.get(b.item_id)! : 9999;
      return indexA - indexB;
    });
  }

  // --- NEW: Dynamic DB Rack Badge Logic ---
  const rackBadge = (rackId: string, positionIndex?: number, rackName?: string) => {
    // 1. If the backend already provided a friendly name, use it.
    if (rackName) return positionIndex != null ? `${rackName} · ${positionIndex}` : rackName;

    // 2. Otherwise, look it up dynamically from the live DB layout!
    const dynamicRack = layout?.elements?.find((e: any) => e.rack_id === rackId);
    const name = dynamicRack?.label || dynamicRack?.name || rackId;

    return positionIndex != null ? `${name} · ${positionIndex}` : name;
  };

  return (
    <>
      <CheckoutModal
        isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleCheckout}
        cartItems={cartItems} pendingListItems={pendingItems} totalAmount={totalAmount}
      />

      <div className="h-screen w-screen bg-background overflow-hidden flex">

        {/* ── Left: Store POV Map ── */}
        <div className="w-1/4 p-4 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <Button variant="outline" size="sm" onClick={onBack}
              className="hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold">
              <Search className="h-4 w-4 mr-1" />Search Items
            </Button>
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1 text-blue-600" />AISLE VIEW
          </h3>
          <div className="flex-1 bg-white rounded-xl shadow-lg p-3 overflow-hidden">
            {/* Compute scanned items so we know which dots to hide */}
            {(() => {
              const scannedItemIds = new Set(cartItems.map((i: any) => i.item_id));

              return (
                <POVStoreMap
                  layout={layout}
                  activePath={activePath}             // From your existing derived state!
                  scannedItemIds={scannedItemIds}
                  povState={povState}
                  cartLocation={cartLocation}
                />
              );
            })()}
          </div>
        </div>

        {/* ── Center: Shopping List / Cart ── */}
        <div className="flex-1 p-6 flex flex-col animate-fade-in min-w-0">

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          {!selectedListId ? (
            /* ── View 1: List Selection (or Confirm step) ── */
            <div className="flex-1 bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center overflow-auto">

              {pendingListId ? (
                /* ── Confirm step: preview the selected list before linking ── */
                (() => {
                  const selectedList = availableLists.find(l => l.list_id === pendingListId);
                  return (
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-amber-500" />
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-800 mb-1">Confirm List Selection</h2>
                      <p className="text-slate-500 mb-5 text-center text-sm">Once confirmed you cannot go back to change your list during this session.</p>
                      <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-5">
                        <h3 className="text-xl font-bold text-slate-800">{selectedList?.list_name ?? pendingListId}</h3>
                        <p className="text-slate-500 mt-1 text-sm">{selectedList?.items?.length ?? 0} items</p>
                        <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                          {(selectedList?.items ?? []).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                              {typeof item === "string" ? item : item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 w-full">
                        <button onClick={() => setPendingListId(null)}
                          className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors">
                          ← Go Back
                        </button>
                        <button onClick={handleConfirmList} disabled={!!selectingList}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
                          {selectingList ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                          Confirm & Start Shopping
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <List className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Your Shopping Lists</h2>
                  <p className="text-slate-500 mb-8">Select a list to start tracking items in the store</p>

                  {loadingLists ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />Loading your lists…
                    </div>
                  ) : !userId ? (
                    /* Guest Mode */
                    <div className="text-slate-400 text-center flex flex-col items-center">
                      <p className="mb-2">You're shopping as a guest.</p>
                      <p className="text-sm mb-6">Scan the QR code to link your account and access your lists.</p>

                      {/* Action for Guest to bypass list selection */}
                      <button
                        onClick={() => setSelectedListId('guest_session')}
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2"
                      >
                        Continue without List <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : availableLists.length === 0 ? (
                    /* User Logged In but No Lists found */
                    <div className="text-center flex flex-col items-center">
                      <p className="text-slate-400 mb-4">No shopping lists found.</p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => setSelectedListId('no_list_session')}
                          className="px-6 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-100 transition-all"
                        >
                          Continue without List
                        </button>
                        <button onClick={fetchLists} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mx-auto">
                          <RefreshCw className="h-4 w-4" />Refresh
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Lists are available - Only Show the Lists */
                    <div className="w-full max-w-lg space-y-4">
                      {availableLists.map(list => (
                        <button key={list.list_id} onClick={() => handleSelectList(list.list_id)}
                          disabled={!!selectingList}
                          className="w-full bg-slate-50 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-100 rounded-2xl p-5 flex items-center justify-between text-left group disabled:opacity-60">
                          <div>
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{list.list_name}</h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                              <span className="flex items-center gap-1 bg-slate-200 px-2 py-0.5 rounded-md">
                                <ShoppingCart className="h-3 w-3" />{list.items?.length ?? 0} items
                              </span>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            {selectingList === list.list_id
                              ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                              : <ArrowRight className="h-5 w-5 text-blue-600" />}
                          </div>
                        </button>
                      ))}
                      <button onClick={fetchLists} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 text-sm py-2">
                        <RefreshCw className="h-4 w-4" />Refresh Lists
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          ) : (
            /* ── View 2: Active Shopping / Cart ── */
            <>
              <div className="flex items-center justify-evenly mb-6">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setShowCart(false)}
                    className={cn("px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
                      !showCart ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300")}>
                    <List className="h-5 w-5" />Shopping List
                  </button>
                  <button onClick={() => setShowCart(true)}
                    className={cn("px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
                      showCart ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300")}>
                    <ShoppingCart className="h-5 w-5" />Cart ({cartItems.length})
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-3xl shadow-lg p-6 overflow-auto">
                {showCart ? (
                  /* Cart Items */
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                      <ShoppingCart className="mr-2 h-6 w-6 text-green-600" />Cart Items
                    </h3>
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No items scanned yet.</p>
                        <p className="text-sm mt-1">Scan items to add them to your cart.</p>
                      </div>
                    ) : cartItems.map((item, idx) => (
                      <div key={idx}
                        className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-200 hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            <span className="text-sm text-slate-500 ml-2">{item.weight_g}g</span>
                          </div>
                          <div className="font-bold text-lg text-blue-600">₹{item.price?.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Shopping List */
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                      <List className="mr-2 h-6 w-6 text-blue-600" />Shopping List
                    </h3>
                    {enrichedItems.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <List className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No items in this list.</p>
                      </div>
                    ) : enrichedItems.map((item, idx) => {
                      const isRecentlyAdded = recentlyAddedItem === item.name; // <-- Check if it's the new item!
                      return (
                        <div key={idx}
                          ref={(el) => (itemRefs.current[item.name] = el)} // <-- Attach the ref!
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between gap-3",
                            item.bought ? "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 opacity-60" :
                              isRecentlyAdded ? "bg-green-50 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)] scale-[1.02] z-10 relative" :
                                "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 hover:scale-[1.02]"
                          )}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">

                            <span className={cn("font-semibold text-slate-800 capitalize flex-1", item.bought && "line-through text-slate-400")}>
                              {item.name}
                            </span>

                            {item.rack_id && (
                              <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
                                {rackBadge(item.rack_id, item.position_index, item.rack_name)}
                              </span>
                            )}
                          </div>
                          {item.bought && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right: Offers + Checkout ── */}
        <div className="w-1/4 p-6 flex flex-col gap-4 min-w-0">

          <div className="flex-1 bg-slate-50 rounded-2xl shadow-md overflow-hidden relative border-4 border-amber-200 flex flex-col">
            {/* Inline CSS for the continuous vertical scroll */}
            <style>{`
              @keyframes scrollVertical {
                0% { transform: translateY(0); }
                100% { transform: translateY(-50%); }
              }
              .animate-scroll-vertical {
                animation: scrollVertical 20s linear infinite;
              }
              .animate-scroll-vertical:hover {
                animation-play-state: paused;
              }
            `}</style>

            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 z-20 shadow-sm flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white tracking-wide">Live Store Offers</h3>
            </div>

            {/* Scrolling Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {offers.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 opacity-50" />
                  <p className="text-sm font-medium">Fetching offers...</p>
                </div>
              ) : (
                <div className="absolute inset-x-0 top-0 flex flex-col gap-3 p-3 animate-scroll-vertical">
                  {/* Repeat the offers array 4 times to ensure a seamless infinite scrolling loop */}
                  {[...offers, ...offers, ...offers, ...offers].map((offer, i) => (
                    <div key={i} className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white shrink-0 shadow-md flex flex-col justify-center min-h-[90px] cursor-default">
                      <h4 className="font-bold text-base mb-1">{offer.title}</h4>
                      <p className="text-sm opacity-90 leading-snug line-clamp-3">{offer.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Fade gradients for smooth entry/exit */}
              <div className="absolute bottom-0 inset-x-0 h-10  z-10 pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-6  z-10 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items</span>
                <span className="font-semibold text-slate-800">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Weight</span>
                <span className="font-semibold text-slate-800">{(totalWeight / 1000).toFixed(3)} kg</span>
              </div>
              <div className="border-t-2 border-slate-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-slate-800">TOTAL</span>
                  <span className="font-bold text-2xl text-blue-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button size="lg" onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg">
              <ShoppingCart className="mr-2 h-5 w-5" />CHECKOUT
            </Button>
          </div>
        </div>

      </div>
    </>
  );
};
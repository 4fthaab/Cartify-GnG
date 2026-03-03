import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, List, MapPin, Search, X, AlertCircle,
  CheckCircle2, ArrowRight, ChevronLeft, Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = "http://192.168.2.22:8000";
const CART_ID = "CART101";
const POLL_MS = 2500;

// ─── Store Layout (embedded from ST001.json) ───────────────────────────────────
// Rack id → friendly display name lookup (fallback if backend doesn't return rack_name)
const RACK_NAME: Record<string, string> = {
  "str001r01": "R1 Fruits",
  "str001r02": "R2 Vegetables",
  "str001r03": "R3 Cooking Essentials",
  "str001r04": "R4 Grains and Pulses",
  "str001r05": "R5 Snacks & Bakery",
  "str001r06": "R6 Dairy & Beverages",
  "str001r07": "R7 Frozen & Meat 2",
  "str001r08": "R9 Personal Care",
  "str001r09": "R10 Household Cleaning",
  "str001r10": "R8 Frozen & Meat 1",
};

interface StoreRackDef {
  rack_id: string; label: string; color: string;
  x: number; y: number; w: number; h: number;
  orientation: "vertical" | "horizontal";
}

const STORE_RACKS: StoreRackDef[] = [
  { rack_id: "str001r01", label: "Fruits", color: "#d6b129", x: 1, y: 1, w: 1, h: 8, orientation: "vertical" },
  { rack_id: "str001r02", label: "Vegetables", color: "#70c021", x: 3, y: 1, w: 1, h: 8, orientation: "vertical" },
  { rack_id: "str001r03", label: "Cooking", color: "#FEE2E2", x: 5, y: 4, w: 15, h: 1, orientation: "horizontal" },
  { rack_id: "str001r04", label: "Grains", color: "#439ecb", x: 5, y: 2, w: 15, h: 1, orientation: "horizontal" },
  { rack_id: "str001r05", label: "Snacks", color: "#eebf58", x: 5, y: 5, w: 7, h: 1, orientation: "horizontal" },
  { rack_id: "str001r06", label: "Dairy & Bev", color: "#76c0f9", x: 5, y: 7, w: 7, h: 1, orientation: "horizontal" },
  { rack_id: "str001r07", label: "Frozen/Meat", color: "#75ffdd", x: 13, y: 7, w: 7, h: 1, orientation: "horizontal" },
  { rack_id: "str001r08", label: "Personal Care", color: "#732edc", x: 21, y: 1, w: 1, h: 8, orientation: "vertical" },
  { rack_id: "str001r09", label: "HH Cleaning", color: "#c6b9b9", x: 23, y: 1, w: 1, h: 8, orientation: "vertical" },
  { rack_id: "str001r10", label: "Frozen/Meat 2", color: "#67fcfe", x: 13, y: 5, w: 7, h: 1, orientation: "horizontal" },
];

const GRID_W = 25;
const GRID_H = 10;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ListItem { name: string; bought: boolean; }
interface CartItem { item_id: string; name: string; weight_g: number; price: number; qty: number; added_at: string; confirmed: boolean; }

interface BackendMatch {
  item_id: string; name: string; rack_id: string; rack_name?: string; position_index: number;
  category_name: string; price?: number; unit_price_per_kg?: number;
  weight_type: string; weight_g?: number; label_variants: string[];
}

interface CurrentLocation { x: number; y: number; marker_id: number; nearby_racks: string[]; }

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

// ─── Rack matching (scored, exact-first) ───────────────────────────────────────
/**
 * Returns the best BackendMatch for a shopping-list item name.
 *
 * Score priority:
 *   4 – exact label_variant match          ("savala" === "savala")
 *   3 – label_variant starts-with query    ("paal" in "paal whole milk")
 *   2 – query contained in a variant       ("juice" in "orange juice")
 *   1 – item.name contains query           ("juice" in "orange juice 1l")
 *
 * The candidate with the highest score wins.
 * Ties are broken by shortest label_variant length (more specific match).
 */
function bestMatch(query: string, matches: BackendMatch[]): BackendMatch | undefined {
  const q = query.toLowerCase().trim();
  if (!q || !matches.length) return undefined;

  let winner: BackendMatch | undefined;
  let winScore = -1;
  let winVariantLen = Infinity;

  for (const bm of matches) {
    const variants = (bm.label_variants ?? []).map(v => v.toLowerCase().trim());
    const bmName = bm.name.toLowerCase();
    let score = -1;
    let matchedLen = Infinity;

    for (const v of variants) {
      let s = -1;
      if (v === q) s = 4;            // exact
      else if (v.startsWith(q) || q.startsWith(v)) s = 3;  // prefix
      else if (v.includes(q) || q.includes(v)) s = 2;  // substring
      if (s > score) { score = s; matchedLen = v.length; }
    }
    // Fallback: item name substring
    if (score < 1 && bmName.includes(q)) { score = 1; matchedLen = bmName.length; }

    if (score > winScore || (score === winScore && matchedLen < winVariantLen)) {
      winScore = score; winVariantLen = matchedLen; winner = bm;
    }
  }
  return winScore >= 1 ? winner : undefined;
}

/** Rack badge label: uses rack_name from API if available, else RACK_NAME fallback */
function rackBadge(rackId: string, positionIndex?: number, rackName?: string): string {
  const name = rackName ?? RACK_NAME[rackId] ?? rackId;
  return positionIndex != null ? `${name} · ${positionIndex}` : name;
}

// ─── Store Map Minimap ─────────────────────────────────────────────────────────

const StoreMinimap = ({
  listItems, backendMatches, nearbyRacks, cartLocation,
}: {
  listItems: ListItem[];
  backendMatches: BackendMatch[];
  nearbyRacks: string[];
  cartLocation?: CurrentLocation;
}) => {
  // Count pending / bought items per rack
  const rackCounts = new Map<string, { pending: number; bought: number }>();
  for (const li of listItems) {
    const bm = bestMatch(li.name, backendMatches);
    if (!bm) continue;
    const c = rackCounts.get(bm.rack_id) ?? { pending: 0, bought: 0 };
    if (li.bought) c.bought++; else c.pending++;
    rackCounts.set(bm.rack_id, c);
  }

  const CELL = 22; // px per grid cell
  const mapW = GRID_W * CELL;
  const mapH = GRID_H * CELL;

  return (
    <div className="w-full">
      {/* Scrollable map */}
      <div className="overflow-auto">
        <div
          className="relative mx-auto"
          style={{ width: mapW, height: mapH, background: "#f1f5f9", borderRadius: 8, border: "1px solid #cbd5e1" }}
        >
          {/* Entry zone */}
          <div className="absolute flex items-center justify-center text-[7px] font-bold text-slate-400 tracking-widest"
            style={{ left: 5 * CELL, top: 9 * CELL, width: 7 * CELL, height: CELL, background: "#e0f2fe66" }}>
            ENTRY
          </div>
          {/* Billing zone */}
          <div className="absolute flex items-center justify-center text-[7px] font-bold text-slate-400 tracking-widest"
            style={{ left: 13 * CELL, top: 9 * CELL, width: 7 * CELL, height: CELL, background: "#fef9c366" }}>
            BILLING
          </div>

          {/* Racks */}
          {STORE_RACKS.map(rack => {
            const counts = rackCounts.get(rack.rack_id);
            const isNear = nearbyRacks.includes(rack.rack_id);
            const hasPend = (counts?.pending ?? 0) > 0;
            const hasBought = (counts?.bought ?? 0) > 0;

            return (
              <div
                key={rack.rack_id}
                title={`${rack.label} (${rack.rack_id})`}
                className="absolute flex items-center justify-center overflow-hidden transition-all duration-400"
                style={{
                  left: rack.x * CELL,
                  top: rack.y * CELL,
                  width: rack.w * CELL,
                  height: rack.h * CELL,
                  background: isNear ? rack.color + "ee" : rack.color + "88",
                  border: `2px solid ${isNear ? rack.color : rack.color + "99"}`,
                  borderRadius: 4,
                  boxShadow: isNear ? `0 0 14px ${rack.color}cc` : undefined,
                  zIndex: isNear ? 5 : 1,
                }}
              >
                {/* Rack name label */}
                <span
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    color: "#1e293b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    writingMode: rack.orientation === "vertical" ? "vertical-rl" : undefined,
                    transform: rack.orientation === "vertical" ? "rotate(180deg)" : undefined,
                    padding: "1px 2px",
                    textShadow: "0 0 4px #fff",
                  }}
                >
                  {rack.label}
                </span>

                {/* NEARBY badge */}
                {isNear && (
                  <div
                    className="absolute top-0.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white rounded-full font-bold"
                    style={{ fontSize: 6, padding: "1px 4px", whiteSpace: "nowrap", zIndex: 10 }}
                  >
                    HERE
                  </div>
                )}

                {/* Item count dots */}
                {(hasPend || hasBought) && (
                  <div
                    className="absolute bottom-0.5 right-0.5 flex gap-0.5"
                    style={{ zIndex: 10 }}
                  >
                    {hasPend && (
                      <div
                        className="rounded-full bg-rose-500 text-white flex items-center justify-center font-bold"
                        style={{ width: 11, height: 11, fontSize: 7 }}
                        title={`${counts!.pending} to pick`}
                      >
                        {counts!.pending}
                      </div>
                    )}
                    {hasBought && (
                      <div
                        className="rounded-full bg-green-500 text-white flex items-center justify-center font-bold"
                        style={{ width: 11, height: 11, fontSize: 7 }}
                        title={`${counts!.bought} picked`}
                      >
                        {counts!.bought}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Cart location dot */}
          {cartLocation && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: cartLocation.x * CELL - 7,
                top: cartLocation.y * CELL - 7,
                width: 14,
                height: 14,
              }}
            >
              <div className="absolute inset-0 rounded-full bg-blue-400 opacity-50 animate-ping" />
              <div className="absolute inset-[2px] rounded-full bg-blue-600 shadow-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 px-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />To pick</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Picked</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />You</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border-2 border-blue-400 inline-block bg-blue-100" />Nearby</span>
      </div>
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

        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 pt-6 pb-5 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/25 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Review Your Cart</h2>
              <p className="text-amber-100 text-xs mt-0.5">Check items before proceeding to payment</p>
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

interface MainInterfaceProps { onBack: () => void; onCheckout: () => void; }

export const MainInterface = ({ onBack, onCheckout }: MainInterfaceProps) => {
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Read user_id from localStorage (set by LoginScreen)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_user");
      if (raw) { const p = JSON.parse(raw); if (p?.user_id) setUserId(p.user_id); }
    } catch { /* guest */ }
  }, []);

  // ── Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
      .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(e => console.error("Camera:", e));
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // ── Poll /cart/display every POLL_MS — single source of truth
  const pollCart = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/cart/display/${CART_ID}`);
      if (!res.ok) return;
      const data: CartDisplay = await res.json();
      if ((data as any).error) return;
      setCartDisplay(data);
      // Auto-enter list view if cart already has a linked list
      if (data.linked_list_id) setSelectedListId(id => id ?? data.linked_list_id!);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    pollCart();
    const id = setInterval(pollCart, POLL_MS);
    return () => clearInterval(id);
  }, [pollCart]);

  // ── Fetch user's shopping lists
  const fetchLists = useCallback(async () => {
    if (!userId) return;
    setLoadingLists(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/shopping-list/get/${userId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAvailableLists((data.shopping_lists ?? []).filter((l: AvailableList) => l.status !== "completed"));
    } catch (e: any) {
      setError(e.message ?? "Failed to load lists");
    } finally { setLoadingLists(false); }
  }, [userId]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  // ── Link list to cart (two-step: preview → confirm)
  const handleSelectList = (listId: string) => {
    // Just show the preview; do NOT call API yet
    setPendingListId(listId);
  };

  const handleConfirmList = async () => {
    if (!pendingListId || !userId) return;
    setSelectingList(pendingListId); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/cart/confirm-list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, list_id: pendingListId, cart_id: CART_ID }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelectedListId(pendingListId); setPendingListId(null); setShowCart(false);
      await pollCart();
    } catch (e: any) {
      setError(e.message ?? "Failed to confirm list");
    } finally { setSelectingList(null); }
  };

  // ── Checkout — just navigate to BillingScreen; actual /cart/checkout is called
  // from PaymentScreen once the user has selected a payment method.
  const handleCheckout = async () => {
    setShowModal(false); onCheckout();
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

  // Enrich list items with matched rack info (uses scored bestMatch)
  const enrichedItems = rawListItems.map(li => {
    const bm = bestMatch(li.name, backendMatches);
    return { ...li, rack_id: bm?.rack_id, rack_name: bm?.rack_name, position_index: bm?.position_index };
  });

  return (
    <>
      <CheckoutModal
        isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleCheckout}
        cartItems={cartItems} pendingListItems={pendingItems} totalAmount={totalAmount}
      />

      <div className="h-screen w-screen bg-background overflow-hidden flex">

        {/* ── Left: Store Map ── */}
        <div className="w-1/4 p-4 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <Button variant="outline" size="sm" onClick={onBack}
              className="hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold">
              <Search className="h-4 w-4 mr-1" />Search Items
            </Button>
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1 text-blue-600" />STORE MAP
          </h3>
          <div className="flex-1 bg-white rounded-xl shadow-lg p-3 overflow-auto">
            <StoreMinimap
              listItems={rawListItems}
              backendMatches={backendMatches}
              nearbyRacks={nearbyRacks}
              cartLocation={cartLocation}
            />
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
                    <div className="text-slate-400 text-center">
                      <p className="mb-2">You're shopping as a guest.</p>
                      <p className="text-sm">Scan the QR code to link your account and access your lists.</p>
                    </div>
                  ) : availableLists.length === 0 ? (
                    <div className="text-center">
                      <p className="text-slate-400 mb-4">No shopping lists found.</p>
                      <button onClick={fetchLists} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mx-auto">
                        <RefreshCw className="h-4 w-4" />Refresh
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-lg space-y-4">
                      {availableLists.map(list => (
                        <button key={list.list_id} onClick={() => handleSelectList(list.list_id)}
                          disabled={!!selectingList}
                          className="w-full bg-slate-50 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 rounded-2xl p-5 flex items-center justify-between text-left group disabled:opacity-60">
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
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setSelectedListId(null)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                  <ChevronLeft className="h-4 w-4" />Back
                </button>

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

                <div className="w-[120px] text-right">
                  {cartDisplay?.list_name && (
                    <span className="text-xs text-slate-400 truncate block">{cartDisplay.list_name}</span>
                  )}
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
                    ) : enrichedItems.map((item, idx) => (
                      <div key={idx}
                        className={cn(
                          "bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-200 hover:scale-[1.02] transition-all duration-300 flex items-center justify-between gap-3",
                          item.bought && "opacity-60"
                        )}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={cn("font-semibold text-slate-800 capitalize flex-1", item.bought && "line-through text-slate-400")}>
                            {item.name}
                          </span>
                          {/* Rack badge — uses friendly name from API (rack_name) or RACK_NAME fallback */}
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
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right: Camera + Checkout ── */}
        <div className="w-1/4 p-6 flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-black rounded-2xl shadow-md overflow-hidden relative border-4 border-blue-200">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 z-10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />SCAN CAMERA
            </div>
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs z-10">
              AI Detection Active
            </div>
            <div className="absolute inset-x-0 h-[2px] bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)] animate-[scan_3s_linear_infinite] z-20 pointer-events-none" />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items</span>
                <span className="font-semibold text-slate-800">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Weight</span>
                <span className="font-semibold text-slate-800">{(totalWeight / 1000).toFixed(2)} kg</span>
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
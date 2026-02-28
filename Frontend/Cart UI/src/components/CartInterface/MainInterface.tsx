import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Camera, ShoppingCart, List, MapPin, Search, X, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainInterfaceProps {
  onBack: () => void;
  onCheckout: () => void;
}

interface ShoppingItem {
  name: string;
  quantity: string;
  price?: number;
  inCart?: boolean;
  isNew?: boolean;
  rack_id?: string;
  position_index?: number;
}

const mockShoppingList: ShoppingItem[] = [
  { name: "RICE",   quantity: "10 Kg", price: 45,  inCart: true,  rack_id: "str001r04", position_index: 2  },
  { name: "OIL",    quantity: "2 Kg",  price: 100, inCart: true,  rack_id: "str001r03", position_index: 1  },
  { name: "APPLE",  quantity: "1 Kg",  price: 20,  inCart: true,  rack_id: "str001r01", position_index: 5  },
  { name: "BANANA", quantity: "1 Kg",  price: 10,  inCart: true,  rack_id: "str001r05", position_index: 8  },
  { name: "PASTA",  quantity: "500g",  price: 30,  inCart: false, rack_id: "str001r02", position_index: 10 },
  { name: "TOMATO", quantity: "1 Kg",  price: 15,  inCart: false, rack_id: "str001r01", position_index: 12 },
];

// ─── Checkout Modal ────────────────────────────────────────────────────────────
const CheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  cartItems,
  pendingItems,
  totalAmount,
  savings,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cartItems: ShoppingItem[];
  pendingItems: ShoppingItem[];
  totalAmount: number;
  savings: number;
}) => {
  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ animation: "mpop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes mpop {
            from { opacity:0; transform:scale(.88) translateY(16px); }
            to   { opacity:1; transform:scale(1)   translateY(0);    }
          }
        `}</style>

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          >
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

        {/* ── Scrollable body ── */}
        <div className="px-5 py-4 space-y-4 max-h-[46vh] overflow-y-auto">

          {/* Cart items */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                In Your Cart ({cartItems.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                    <span className="text-xs text-slate-400">{item.quantity}</span>
                  </div>
                  <span className="font-bold text-green-700 text-sm">${item.price?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending items */}
          {pendingItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Not Yet Scanned ({pendingItems.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {pendingItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-sm text-slate-500">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.quantity}</span>
                    </div>
                    <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      Not scanned
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Totals ── */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span><span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>You Saved</span><span>−${savings.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
            <span className="font-bold text-slate-800">Total</span>
            <span className="font-bold text-xl text-blue-600">${(totalAmount - savings).toFixed(2)}</span>
          </div>
        </div>

        {/* ── Buttons ── */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors text-sm"
          >
            ← Back to Cart
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            Confirm &amp; Pay <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

// ─── Main Interface ────────────────────────────────────────────────────────────
export const MainInterface = ({ onBack, onCheckout }: MainInterfaceProps) => {
  const [showCart, setShowCart] = useState(false);
  const [showModal, setShowModal] = useState(false);   // ← controls modal

  const cartItems    = mockShoppingList.filter((item) =>  item.inCart);
  const pendingItems = mockShoppingList.filter((item) => !item.inCart);
  const listItems    = mockShoppingList;
  const totalAmount  = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const savings      = 2.5;

  const formatRackName = (rackId?: string) => {
    if (!rackId) return "";
    const match = rackId.match(/r(\d+)/);
    return match ? `R${parseInt(match[1], 10)}` : rackId;
  };

  return (
    <>
      {/* ── Modal ── */}
      <CheckoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => { setShowModal(false); onCheckout(); }}
        cartItems={cartItems}
        pendingItems={pendingItems}
        totalAmount={totalAmount}
        savings={savings}
      />

      <div className="h-screen w-screen bg-background overflow-hidden flex">

        {/* ── Left: Minimap ── */}
        <div className="w-1/4 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <Button variant="outline" size="sm" onClick={onBack}
              className="hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold">
              <Search className="h-4 w-4 mr-1" />Search Items
            </Button>
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1 text-blue-600" />NEARBY RACKS
          </h3>
          <div className="flex-1 bg-white rounded-xl shadow-lg p-3 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="relative h-[500px] flex items-center gap-4">

                {/* Left Rack */}
                <div className="relative w-28 h-full bg-gradient-to-b from-amber-50 to-amber-100 rounded-3xl shadow-xl border border-amber-200 overflow-hidden">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 rotate-90 text-sm font-semibold tracking-wide text-slate-600 pointer-events-none">
                    Fruits
                  </span>
                  {listItems.filter(i => i.rack_id === "str001r01").map((item, idx) => (
                    <div key={idx} className="absolute w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.6)]"
                      style={{ top: `${(item.position_index! / 20) * 420 + 40}px`, right: "12px" }} />
                  ))}
                </div>

                {/* Aisle / You */}
                <div className="relative w-16 h-full flex items-center justify-center">
                  <div className="absolute bottom-16 flex flex-col items-center">
                    <div className="relative">
                      <div className="w-5 h-5 bg-blue-600 rounded-full animate-ping absolute opacity-30" />
                      <div className="w-5 h-5 bg-blue-600 rounded-full relative" />
                    </div>
                    <span className="text-xs mt-2 text-slate-600 font-medium">You</span>
                  </div>
                </div>

                {/* Right Rack */}
                <div className="relative w-28 h-full bg-gradient-to-b from-emerald-50 to-emerald-100 rounded-3xl shadow-xl border border-emerald-200 overflow-hidden">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold tracking-wide text-slate-600 pointer-events-none">
                    Vegetables
                  </span>
                  {listItems.filter(i => i.rack_id === "str001r02").map((item, idx) => (
                    <div key={idx} className="absolute w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.6)]"
                      style={{ top: `${(item.position_index! / 20) * 420 + 40}px`, left: "12px" }} />
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Center: Shopping List / Cart ── */}
        <div className="flex-1 p-6 flex flex-col animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
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

          <div className="flex-1 bg-white rounded-3xl shadow-lg p-6 overflow-auto">
            {showCart ? (
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  <ShoppingCart className="mr-2 h-6 w-6 text-green-600" />Cart Items
                </h3>
                {cartItems.map((item, idx) => (
                  <div key={idx} className={cn("bg-gradient-to-r p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                    item.isNew ? "from-green-50 to-emerald-50 border-green-400 shadow-md"
                               : "from-slate-50 to-slate-100 border-slate-200")}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {item.isNew && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">NEW</span>}
                        </div>
                        <span className="text-sm text-slate-500">{item.quantity}</span>
                      </div>
                      <div className="font-bold text-lg text-blue-600">${item.price?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  <List className="mr-2 h-6 w-6 text-blue-600" />Shopping List
                </h3>
                {listItems.map((item, idx) => (
                  <div key={idx} className={cn("bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-200 transition-all duration-300 hover:scale-[1.02]",
                    item.inCart && "opacity-60")}>
                    <div className="flex-1 flex gap-2 flex-row items-center">
                      <div>
                        <span className={cn("font-semibold text-slate-800", item.inCart && "line-through text-slate-400")}>
                          {item.name}
                        </span>
                        <span className="text-sm text-slate-500 ml-2">{item.quantity}</span>
                      </div>
                      {item.rack_id && (
                        <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1 w-fit">
                          {formatRackName(item.rack_id)} • {item.position_index}
                        </span>
                      )}
                    </div>
                    {item.inCart && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Camera + Checkout ── */}
        <div className="w-1/4 p-6 flex flex-col gap-4">
          <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-md overflow-hidden relative border-4 border-blue-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="h-20 w-20 text-slate-300" />
            </div>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              SCAN CAMERA
            </div>
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs">
              AI Detection Active
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items</span>
                <span className="font-semibold text-slate-800">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-800">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>You Saved</span>
                <span className="font-semibold">${savings.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-slate-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-slate-800">TOTAL</span>
                  <span className="font-bold text-2xl text-blue-600">${(totalAmount - savings).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* ← THIS is the only CHECKOUT button. It opens the modal. */}
            <Button
              size="lg"
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              CHECKOUT
            </Button>
          </div>
        </div>

      </div>
    </>
  );
};
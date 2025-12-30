import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ShoppingCart, List, MapPin, Search } from "lucide-react";
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
}

const mockShoppingList: ShoppingItem[] = [
  { name: "RICE", quantity: "10 Kg", price: 45, inCart: true },
  { name: "OIL", quantity: "2 Kg", price: 100, inCart: true },
  { name: "SHAMPOO", quantity: "1", price: 3, inCart: true, isNew: true },
  { name: "SOAP", quantity: "3", price: 9, inCart: true },
  { name: "APPLE", quantity: "1 Kg", price: 20, inCart: true },
  { name: "BANANA", quantity: "1 Kg", price: 10, inCart: true },
  { name: "BRINJAL", quantity: "500g", price: 2.5, inCart: true },
  { name: "PASTA", quantity: "500g" },
  { name: "TOMATO", quantity: "1 Kg" },
];

export const MainInterface = ({ onBack, onCheckout }: MainInterfaceProps) => {
  const [showCart, setShowCart] = useState(false);

  const cartItems = mockShoppingList.filter((item) => item.inCart);
  const listItems = mockShoppingList;
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const savings = 2.5;

  // Generate detailed minimap for 2 racks
  const generateMiniRack = (rackNumber: number, highlightedItems: string[]) => {
    const compartments: number[] = [];
    
    if (rackNumber % 2 === 1) {
      for (let j = 1; j <= 50; j++) {
        compartments.push(j);
      }
    } else {
      for (let j = 1; j <= 25; j++) {
        compartments.push(j);
      }
      for (let j = 50; j >= 26; j--) {
        compartments.push(j);
      }
    }
    
    return compartments;
  };

  const rack1Items = ["Milk", "Curd"];
  const rack2Items = ["Chicken", "Meat"];

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex">
      {/* Left Section: Detailed Mini Map */}
      <div className="w-1/4 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold"
          >
            <Search className="h-4 w-4 mr-1" />
            Search Items
          </Button>
        </div>

        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-center">
          <MapPin className="h-4 w-4 mr-1 text-blue-600" />
          NEARBY RACKS
        </h3>

        {/* Detailed Mini Map Display */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-3 overflow-auto">
          <div className="space-y-4">
            {/* Rack 1 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 text-center">Rack 1</h4>
              <div className="grid grid-cols-10 gap-0.5">
                {generateMiniRack(1, rack1Items).slice(0, 20).map((num) => {
                  const isHighlighted = num === 4 || num === 8;
                  const label = num === 4 ? "Milk" : num === 8 ? "Curd" : "";
                  
                  return (
                    <div
                      key={`r1-${num}`}
                      className={cn(
                        "aspect-square text-[8px] font-semibold flex items-center justify-center rounded border transition-all",
                        isHighlighted
                          ? "bg-yellow-300 border-yellow-600 scale-110 shadow-md relative"
                          : "bg-slate-100 border-slate-300 text-slate-500"
                      )}
                      title={label}
                    >
                      {isHighlighted ? (
                        <div className="relative group">
                          <div className="w-full h-full flex items-center justify-center">
                            {num}
                          </div>
                          {label && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-1 py-0.5 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {label}
                            </div>
                          )}
                        </div>
                      ) : (
                        num
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart Position Indicator */}
            <div className="flex items-center justify-center py-1">
              <div className="flex items-center gap-2 bg-green-100 border-2 border-green-500 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-700">YOU ARE HERE</span>
              </div>
            </div>

            {/* Rack 2 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 text-center">Rack 2</h4>
              <div className="grid grid-cols-10 gap-0.5">
                {generateMiniRack(2, rack2Items).slice(0, 20).map((num) => {
                  const isHighlighted = num === 2 || num === 15;
                  const label = num === 2 ? "Chicken" : num === 15 ? "Meat" : "";
                  
                  return (
                    <div
                      key={`r2-${num}`}
                      className={cn(
                        "aspect-square text-[8px] font-semibold flex items-center justify-center rounded border transition-all",
                        isHighlighted
                          ? "bg-yellow-300 border-yellow-600 scale-110 shadow-md relative"
                          : "bg-slate-100 border-slate-300 text-slate-500"
                      )}
                      title={label}
                    >
                      {isHighlighted ? (
                        <div className="relative group">
                          <div className="w-full h-full flex items-center justify-center">
                            {num}
                          </div>
                          {label && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-1 py-0.5 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {label}
                            </div>
                          )}
                        </div>
                      ) : (
                        num
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: Shopping List / Cart Items */}
      <div className="flex-1 p-6 flex flex-col animate-fade-in">
        {/* Toggle Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setShowCart(false)}
            className={cn(
              "px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
              !showCart
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            )}
          >
            <List className="h-5 w-5" />
            Shopping List
          </button>
          <button
            onClick={() => setShowCart(true)}
            className={cn(
              "px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
              showCart
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            )}
          >
            <ShoppingCart className="h-5 w-5" />
            Cart ({cartItems.length})
          </button>
        </div>

        {/* Card Container */}
        <div className="flex-1 bg-white rounded-3xl shadow-lg p-6 overflow-auto">
          <div className="transition-all duration-500 transform">
            {showCart ? (
              // Cart Items View
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  <ShoppingCart className="mr-2 h-6 w-6 text-green-600" />
                  Cart Items
                </h3>
                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "bg-gradient-to-r p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                      item.isNew
                        ? "from-green-50 to-emerald-50 border-green-400 shadow-md"
                        : "from-slate-50 to-slate-100 border-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {item.isNew && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-500">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-blue-600">${item.price?.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Shopping List View
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  <List className="mr-2 h-6 w-6 text-blue-600" />
                  Shopping List
                </h3>
                {listItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-200 transition-all duration-300 hover:scale-[1.02]",
                      item.inCart && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span
                          className={cn(
                            "font-semibold text-slate-800",
                            item.inCart && "line-through text-slate-400"
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="text-sm text-slate-500 ml-2">{item.quantity}</span>
                      </div>
                      {item.inCart && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Camera + Checkout */}
      <div className="w-1/4 p-6 flex flex-col gap-4">
        {/* Camera Feed */}
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

        {/* Checkout Section */}
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
                <span className="font-bold text-2xl text-blue-600">
                  ${(totalAmount - savings).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            CHECKOUT
          </Button>
        </div>
      </div>
    </div>
  );
};
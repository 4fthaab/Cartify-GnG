import { Search, ChevronRight, LogOut, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

interface MinimapSearchProps {
  onNext: () => void;
  onLogout?: () => void;
}

// 🗺️ Static item dataset
const staticItems: Record<string, { location: string; image: string }> = {
  Apple: { location: "r1c2", image: "/images/apple.png" },
  Banana: { location: "r1c26", image: "/images/banana.png" },
  Bread: { location: "r2c10", image: "/images/bread.png" },
  Milk: { location: "r3c5", image: "/images/milk.png" },
  Chips: { location: "r4c48", image: "/images/chips.png" },
  Soap: { location: "r2c30", image: "/images/soap.png" },
};

export const MinimapSearch = ({ onNext, onLogout }: MinimapSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ name: string; image: string } | null>(
    null
  );
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // 🔍 Filter suggestions
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) return setSuggestions([]);
    const matches = Object.keys(staticItems).filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(matches);
  };

  // 📍 Handle item select
  const handleSelect = (itemName: string) => {
    setSearchQuery(itemName);
    setSuggestions([]);
    setHighlighted(staticItems[itemName].location);
    setSelectedItem(itemName);
    setPopup({ name: itemName, image: staticItems[itemName].image });
    
    // Show add to list dialog after a short delay
    setTimeout(() => {
      setShowAddItemDialog(true);
    }, 500);
    
    // Auto-hide popup after 3 seconds
    setTimeout(() => setPopup(null), 3000);
  };

  // 🧮 Compartment generation (serpentine pattern)
  const generateCompartments = (rackIndex: number) => {
    const comps: number[] = [];
    
      for (let j = 1; j <= 25; j++) {
        comps.push(j);
      }
      for (let j = 50; j >= 26; j--) {
        comps.push(j);
      }
    return comps;
  };

  // 🚪 Logout confirmation
  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    if (onLogout) {
      onLogout();
    }
  };

  // ➕ Add item to shopping list
  const handleAddToList = () => {
    setShowAddItemDialog(false);
    // Navigate to main interface
    onNext();
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="ml-4">
              <h2 className="text-3xl font-bold text-slate-800">Store Map</h2>
              <p className="text-slate-600">
                Find items and add to your shopping list
              </p>
            </div>
          </div>

          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
          >
            Shopping List & Cart
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 h-14 text-lg border-2 border-slate-200 focus:border-blue-500 bg-white rounded-xl shadow-sm"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 z-10 max-h-48 overflow-y-auto border border-slate-200">
                {suggestions.map((item) => (
                  <div
                    key={item}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={staticItems[item].image}
                      alt={item}
                      className="w-8 h-8 rounded-md object-cover"
                    />
                    <span className="font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Grid (4 racks × 50 compartments) */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 overflow-auto border border-slate-200">
          <div className="space-y-8">
            <br></br>
            {Array.from({ length: 4 }).map((_, rackIndex) => {
              const compartments = generateCompartments(rackIndex + 1);
              return (
                <>
                <div key={rackIndex} className="space-y-3">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {compartments.map((compartmentNumber) => {
                      const id = `r${rackIndex + 1}c${compartmentNumber}`;
                      const isHighlighted = highlighted === id;
                      return (
                        <div
                          key={`${id}-${compartmentNumber}`}
                          className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                            isHighlighted
                              ? "bg-yellow-400 scale-110 border-yellow-600 shadow-lg text-slate-900"
                              : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600"
                          }`}
                        >
                          {compartmentNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>
                </>
              );
            })}
            <br></br>
          </div>
        </div>

        {/* Popup */}
        {popup && (
          <div className="fixed top-20 right-8 bg-white border-2 border-slate-200 shadow-2xl rounded-2xl p-5 z-50 animate-in fade-in slide-in-from-right-5 duration-300">
            <img
              src={popup.image}
              alt={popup.name}
              className="w-24 h-24 rounded-xl mb-3 object-cover"
            />
            <p className="text-center font-bold text-slate-800 text-lg">
              {popup.name}
            </p>
          </div>
        )}
      </div>

      {/* Add to Shopping List Dialog */}
      <AlertDialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-500" />
              Add to Shopping List?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Would you like to add <span className="font-semibold text-slate-800">{selectedItem}</span> to your shopping list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-700">
              No, Thanks
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddToList}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Yes, Add Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
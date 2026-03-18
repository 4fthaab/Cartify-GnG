import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useState, useEffect } from 'react';

interface ShoppingListScreenProps {
  onBack: () => void;
}

const API_BASE = "http://192.168.2.22:8000";

export function ShoppingListScreen({ onBack }: ShoppingListScreenProps) {

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const [lists, setLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [newItem, setNewItem] = useState('');
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch all lists
  // 🔥 Fetch all lists
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchLists = async () => {
      try {
        const res = await fetch(`${API_BASE}/shopping-list/get/${user.user_id}`);
        const data = await res.json();

        if (data.shopping_lists) {
          setLists(data.shopping_lists);
          // Removed: setSelectedList(data.shopping_lists[0]);
        }
      } catch (err) {
        console.error("Failed to fetch lists", err);
      }
      setLoading(false);
    };

    fetchLists();
  }, [user?.user_id]); // Added user?.user_id to dependency array for best practice

  // 🔥 Create New List
  const createList = async () => {
    if (!newListName.trim()) return;

    const res = await fetch(`${API_BASE}/shopping-list/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        list_name: newListName,
        items: []
      })
    });

    const data = await res.json();
    console.log(data)

    if (!data.error) {
      setNewListName('');
      refreshLists();
    }
  };

  // 🔥 Add Item
  const addItem = async () => {
    if (!newItem.trim() || !selectedList) return;

    await fetch(`${API_BASE}/shopping-list/add-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        list_id: selectedList.list_id,
        item_name: newItem
      })
    });

    setNewItem('');
    refreshLists();
  };

  const deleteItem = async (itemName: string) => {
    if (!selectedList) return;

    await fetch(`${API_BASE}/shopping-list/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        list_id: selectedList.list_id,
        items: [itemName]
      })
    });

    refreshLists();
  };

  // 🔥 Delete Entire List
  const deleteList = async (list_id: string) => {
    await fetch(`${API_BASE}/shopping-list/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        list_id
      })
    });

    refreshLists();
  };

  // 🔥 Refresh Lists
  // 🔥 Refresh Lists
  const refreshLists = async () => {
    try {
      const res = await fetch(`${API_BASE}/shopping-list/get/${user.user_id}`);
      const data = await res.json();

      if (data.shopping_lists) {
        setLists(data.shopping_lists);

        // Find the currently selected list in the fresh data and keep it selected
        setSelectedList((prevSelected: any) => {
          if (!prevSelected) return null; // If no list was selected, stay on "All Lists"

          // Find the updated version of the active list
          const updatedList = data.shopping_lists.find(
            (list: any) => list.list_id === prevSelected.list_id
          );

          return updatedList || null;
        });
      }
    } catch (err) {
      console.error("Failed to refresh lists", err);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">

      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="flex-1 text-foreground">Shopping Lists</h2>
        </div>

        {/* Create New List */}
        <div className="flex gap-2">
          <Input
            placeholder="New list name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="flex-1 rounded-xl"
          />
          <Button onClick={createList} className="bg-[#FF3347] text-white rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Conditional Rendering: Show either ALL lists, or ONLY the selected list */}
        {!selectedList ? (
          /* --- VIEW 1: ALL LISTS --- */
          <div className="space-y-3">
            {lists.map((list) => (
              <Card
                key={list.list_id}
                className="p-4 rounded-2xl cursor-pointer hover:border-[#FF3347]/50 transition-colors"
                onClick={() => setSelectedList(list)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-foreground font-medium">{list.list_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {list.items.length} items
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents selecting the list when clicking delete
                      deleteList(list.list_id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* --- VIEW 2: SELECTED LIST DETAIL --- */
          <div className="space-y-4">

            {/* 1. Selected List Header (Clicking this clears the selection to show all lists again) */}
            <Card
              className="p-4 rounded-2xl border-2 border-[#FF3347] cursor-pointer"
              onClick={() => setSelectedList(null)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-foreground font-medium">
                    <span className="text-muted-foreground mr-2 text-sm">← Back</span>
                    {selectedList.list_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedList.items.length} items
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteList(selectedList.list_id);
                    setSelectedList(null); // Clear selection if the active list is deleted
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </Card>

            {/* 2. Add Item Input (Appears directly below the selected list header) */}
            <Card className="p-4 rounded-2xl">
              <div className="flex gap-2">
                <Input
                  placeholder="Add item..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  className="flex-1 rounded-xl"
                />
                <Button onClick={addItem} className="bg-[#FF3347] hover:bg-[#FF3347]/90 text-white rounded-xl">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* 3. Selected List Items (Linear styling instead of 2-column cards) */}
            <div className="space-y-2 px-2">
              {selectedList.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 group"
                >
                  <p className="text-foreground flex-1">{item.name}</p>

                  <button
                    onClick={() => deleteItem(item.name)}
                    className="text-red-500 opacity-60 hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {loading && (
          <p className="text-muted-foreground text-sm">Loading lists...</p>
        )}

      </div>
    </div>
  );
}
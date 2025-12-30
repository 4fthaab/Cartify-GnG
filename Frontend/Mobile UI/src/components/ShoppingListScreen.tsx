import { ArrowLeft, Upload, ScanText, Plus, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useState } from 'react';

interface ShoppingListScreenProps {
  onBack: () => void;
}

export function ShoppingListScreen({ onBack }: ShoppingListScreenProps) {
  const [items, setItems] = useState([
    { id: 1, name: 'Milk', checked: false, aisle: 'A3' },
    { id: 2, name: 'Bread', checked: false, aisle: 'B1' },
    { id: 3, name: 'Apples', checked: true, aisle: 'A1' },
    { id: 4, name: 'Chicken', checked: false, aisle: 'C2' },
  ]);

  const [newItem, setNewItem] = useState('');

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, { 
        id: Date.now(), 
        name: newItem, 
        checked: false,
        aisle: '?'
      }]);
      setNewItem('');
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
          <h2 className="flex-1 text-foreground">Shopping List</h2>
        </div>

        {/* Upload Options */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="rounded-xl h-12 gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
          <Button variant="outline" className="rounded-xl h-12 gap-2">
            <ScanText className="w-4 h-4" />
            Scan OCR
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Add Item */}
        <Card className="p-4 rounded-2xl mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Add new item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="flex-1 border-0 bg-input-background rounded-xl"
            />
            <Button 
              onClick={addItem}
              className="bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl px-4"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* List Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <Card 
              key={item.id}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                item.checked ? 'bg-accent' : 'bg-card'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  item.checked ? 'bg-[#FF3347] border-[#FF3347]' : 'border-border'
                }`}>
                  {item.checked && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`flex-1 text-foreground ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}
                </span>
                <span className="text-sm text-muted-foreground">Aisle {item.aisle}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-3">
          <Card className="flex-1 p-4 rounded-2xl bg-card text-center">
            <p className="text-2xl text-foreground">{items.filter(i => !i.checked).length}</p>
            <p className="text-sm text-muted-foreground">Remaining</p>
          </Card>
          <Card className="flex-1 p-4 rounded-2xl bg-card text-center">
            <p className="text-2xl text-foreground">{items.filter(i => i.checked).length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

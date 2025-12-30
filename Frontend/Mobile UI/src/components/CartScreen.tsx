import { ArrowLeft, Minus, Plus, Trash2, Scan, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useState } from 'react';

interface CartScreenProps {
  onBack: () => void;
  isCartLinked: boolean;
  onCartLinked: () => void;
}

export function CartScreen({ onBack, isCartLinked, onCartLinked }: CartScreenProps) {
  const [isScanning, setIsScanning] = useState(!isCartLinked);
  const [cartItems, setCartItems] = useState(
    isCartLinked ? [
      { id: 1, name: 'Organic Apples', price: 4.99, quantity: 2, image: '🍎' },
      { id: 2, name: 'Whole Milk', price: 3.49, quantity: 1, image: '🥛' },
      { id: 3, name: 'Whole Wheat Bread', price: 2.99, quantity: 1, image: '🍞' },
    ] : []
  );

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const handleScan = () => {
    // Simulate QR scan
    setTimeout(() => {
      setIsScanning(false);
      setCartItems([
        { id: 1, name: 'Organic Apples', price: 4.99, quantity: 2, image: '🍎' },
        { id: 2, name: 'Whole Milk', price: 3.49, quantity: 1, image: '🥛' },
        { id: 3, name: 'Whole Wheat Bread', price: 2.99, quantity: 1, image: '🍞' },
      ]);
      onCartLinked();
    }, 1500);
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // QR Scan View
  if (isScanning) {
    return (
      <div className="h-full bg-background flex flex-col">
        {/* Header */}
        <div className="bg-card px-6 py-4 shadow-sm border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h2 className="text-foreground">Link Your Cart</h2>
              <p className="text-sm text-muted-foreground">Scan QR to sync items</p>
            </div>
          </div>
        </div>

        {/* Scan Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-24 h-24 bg-[#FF3347] rounded-2xl flex items-center justify-center mb-4">
            <Scan className="w-12 h-12 text-white" />
          </div>
          
          <h3 className="text-xl text-center text-foreground">Scan Cart QR Code</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Point your camera at the QR code on your shopping cart to link and sync items
          </p>

          <div className="w-64 h-64 bg-accent rounded-2xl flex items-center justify-center my-8 relative border border-border">
            <div className="absolute inset-4 border-2 border-[#FF3347] rounded-xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF3347] rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF3347] rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF3347] rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF3347] rounded-br-lg"></div>
            </div>
            <Scan className="w-12 h-12 text-muted-foreground animate-pulse" />
          </div>

          <Button 
            onClick={handleScan}
            className="w-full max-w-sm bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12"
          >
            Simulate QR Scan
          </Button>

          <button className="text-muted-foreground underline mt-2">
            Enter cart ID manually
          </button>
        </div>
      </div>
    );
  }

  // Cart View
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-foreground">My Cart</h2>
            <p className="text-sm text-muted-foreground">{cartItems.length} items</p>
          </div>
        </div>

        {/* Cart Linked Status */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-300">Cart Linked Successfully</p>
              <p className="text-xs text-green-600 dark:text-green-400">Cart ID: #GNG-1234</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {cartItems.map((item) => (
          <Card key={item.id} className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center text-3xl">
                {item.image}
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-foreground">{item.name}</h4>
                <p className="text-[#FF3347]">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => updateQuantity(item.id, -999)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center hover:bg-accent/80 border border-border"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="w-8 text-center text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 bg-[#FF3347] text-white rounded-lg flex items-center justify-center hover:bg-[#FF5566]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Savings Card */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 dark:text-green-300">💰 You're saving</p>
              <p className="text-green-900 dark:text-green-100 text-xl">$3.50</p>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Member discounts applied
            </div>
          </div>
        </Card>
      </div>

      {/* Checkout Summary */}
      <div className="bg-card p-6 shadow-lg border-t border-border">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>${(total * 0.08).toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border text-foreground">
            <span>Total</span>
            <span className="text-xl text-[#FF3347]">${(total * 1.08).toFixed(2)}</span>
          </div>
        </div>
        <Button className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12">
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}

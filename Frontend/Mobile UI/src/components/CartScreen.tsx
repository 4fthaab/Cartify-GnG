import { ArrowLeft, Scan, CheckCircle, ShoppingCart, Scale, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

interface CartScreenProps {
  onBack: () => void;
  isCartLinked: boolean;
  onCartLinked: () => void;
}

const cartData = [
  { id: 1, name: 'Organic Apples',     category: 'Produce',  price: 4.99,  qty: '1.2 kg', image: '🍎', perUnit: '/ kg',  isWeighed: true  },
  { id: 2, name: 'Whole Milk',         category: 'Dairy',    price: 3.49,  qty: '1 unit', image: '🥛', perUnit: '/ unit', isWeighed: false },
  { id: 3, name: 'Whole Wheat Bread',  category: 'Bakery',   price: 2.99,  qty: '1 unit', image: '🍞', perUnit: '/ unit', isWeighed: false },
  { id: 4, name: 'Baby Spinach',       category: 'Produce',  price: 3.20,  qty: '0.8 kg', image: '🥬', perUnit: '/ kg',  isWeighed: true  },
  { id: 5, name: 'Cheddar Cheese',     category: 'Dairy',    price: 5.49,  qty: '1 unit', image: '🧀', perUnit: '/ unit', isWeighed: false },
];

export function CartScreen({ onBack, isCartLinked, onCartLinked }: CartScreenProps) {
  const [isScanning, setIsScanning] = useState(!isCartLinked);
  const [isLinked, setIsLinked] = useState(isCartLinked);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const handleScan = () => {
    setTimeout(() => {
      setIsScanning(false);
      setIsLinked(true);
      onCartLinked();
    }, 1500);
  };

  const handlePaymentScan = () => {
    setPaymentDone(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setPaymentDone(false);
      onBack();
    }, 2000);
  };

  const subtotal = cartData.reduce((sum, item) => sum + item.price, 0);
  const savings  = 3.50;
  const tax      = subtotal * 0.08;
  const total    = subtotal + tax;

  // ── QR Scan View ──────────────────────────────────────────────
  if (isScanning) {
    return (
      <div className="h-full w-full flex flex-col bg-background">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">Link Your Cart</h2>
            <p className="text-xs text-muted-foreground">Scan QR to sync items</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-6 py-4" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div className="text-center">
            <div className="w-12 h-20 bg-[#FF3347] rounded-xl flex items-center justify-center mx-auto mb-5">
              <Scan className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Scan Cart QR Code</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Point your camera at the QR code on your<br />shopping cart to link and sync items
            </p>
          </div>

          <div className="relative w-full h-[] px-2">
            <div className="relative bg-gray-100 rounded-3xl flex items-center justify-center w-full" style={{ height: '300px', marginTop: '20px', marginBottom: '20px' }}>
              
              <div className="absolute top-2 left-2 w-10 h-10 border-t-[5px] border-l-[5px] border-[#FF3347] rounded-tl-2xl" />
              <div className="absolute top-2 right-2 w-10 h-10 border-t-[5px] border-r-[5px] border-[#FF3347] rounded-tr-2xl" />
              <div className="absolute bottom-2 left-2 w-10 h-10 border-b-[5px] border-l-[5px] border-[#FF3347] rounded-bl-2xl" />
              <div className="absolute bottom-2 right-2 w-10 h-10 border-b-[5px] border-r-[5px] border-[#FF3347] rounded-br-2xl" />
              <Scan className="w-9 h-9 text-gray-300" />
            </div>
          </div>

          <div className="w-full space-y-3">
            <Button onClick={handleScan} className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12 text-base">
              Simulate QR Scan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment QR Screen ──────────────────────────────────────────
  if (isCheckingOut) {
    return (
      <div className="h-ful w-full flex flex-col bg-background">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
          <button onClick={() => setIsCheckingOut(false)} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">Payment</h2>
            <p className="text-xs text-muted-foreground">Scan to pay at the counter</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-6 py-8">

          {paymentDone ? (
            /* Payment success */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-full h-full rounded-full bg-green-100 flex items-center justify-center mb-5"style={{ height: "68%" }}>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-2">Thank you for shopping with us 🎉</p>
              <p className="text-2xl font-bold text-[#FF3347] mt-4">${total.toFixed(2)}</p>
            </div>
          ) : (
            <>
              {/* Amount card */}
              <div className="w-full bg-gradient-to-r from-[#FF3347] to-[#FF5566] rounded-2xl px-6 py-5 text-white">
                <p className="text-sm text-white/80">Total Amount Due</p>
                <p className="text-3xl font-bold mt-1">${total.toFixed(2)}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
                  <span>{cartData.length} items</span>
                  <span>·</span>
                  <span>Cart #GNG-1234</span>
                </div>
              </div>

              {/* QR Scanner b ox — same style as cart link screen */}
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-sm text-muted-foreground">Present this at the payment terminal</p>

                <div className="relative bg-gray-100 rounded-3xl flex items-center justify-center w-full" style={{ height: '400px' }}>
                  {/* Full red border */}
                  
                  {/* Corner brackets */}
                  <div className="absolute top-2 left-2 w-10 h-10 border-t-[5px] border-l-[5px] border-[#FF3347] rounded-tl-2xl" />
                  <div className="absolute top-2 right-2 w-10 h-10 border-t-[5px] border-r-[5px] border-[#FF3347] rounded-tr-2xl" />
                  <div className="absolute bottom-2 left-2 w-10 h-10 border-b-[5px] border-l-[5px] border-[#FF3347] rounded-bl-2xl" />
                  <div className="absolute bottom-2 right-2 w-10 h-10 border-b-[5px] border-r-[5px] border-[#FF3347] rounded-br-2xl" />
                  {/* Centre scan icon */}
                  <Scan className="w-9 h-9 text-gray-300" />
                </div>

                <p className="text-xs text-muted-foreground">Order ID: #GNG-1234-PAY</p>
              </div>

              {/* Simulate button */}
              <div className="w-full space-y-3">
                <Button
                  onClick={handlePaymentScan}
                  className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12 text-base"
                >
                  Simulate Payment Scan
                </Button>
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="w-full text-sm text-muted-foreground underline underline-offset-4 py-1"
                >
                  Go back to cart
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    );
  }

  // ── Cart View ──────────────────────────────────────────────────
  return (
    <div className="h-full w-full flex flex-col bg-background">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">My Cart</h2>
            <p className="text-xs text-muted-foreground">{cartData.length} items in your cart</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-700 font-medium">Live</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Cart Linked Successfully</p>
            <p className="text-xs text-green-600">Cart ID: #GNG-1234 · Syncing in real-time</p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Cart Items</span>
        </div>

        {cartData.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
            <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center text-3xl shrink-0">
              {item.image}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm leading-tight">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs bg-[#FF3347]/10 text-[#FF3347] rounded-full px-2 py-0.5 font-medium">
                  {item.qty}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-foreground">${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mt-2">
          <div>
            <p className="text-sm text-green-700">💰 You're saving</p>
            <p className="text-xl font-semibold text-green-900">${savings.toFixed(2)}</p>
          </div>
          <span className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1">Member discounts</span>
        </div>
      </div>

      {/* Checkout summary */}
      <div className="px-6 pt-4 pb-4 border-t border-border bg-card shrink-0">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal ({cartData.length} items)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Member savings</span>
            <span className="text-green-600">−${savings.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-semibold text-[#FF3347]">${total.toFixed(2)}</span>
          </div>
        </div>
        <Button
          onClick={() => setIsCheckingOut(true)}
          className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12 text-base"
        >
          Proceed to Checkout
        </Button>
      </div>

    </div>
  );
}
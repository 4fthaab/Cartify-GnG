import { ArrowLeft, Scan, CheckCircle, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";

const API_BASE = "http://192.168.2.22:8000";

interface CartScreenProps {
  onBack: () => void;
  isCartLinked: boolean;
  onCartLinked: () => void;
}

export function CartScreen({ onBack, isCartLinked, onCartLinked }: CartScreenProps) {
  const [isScanning, setIsScanning] = useState(!isCartLinked);
  const [isLinked, setIsLinked] = useState(isCartLinked);

  // Checkout & Payment States
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Live Cart Data States
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartSummary, setCartSummary] = useState({ total_price: 0, tax: 0 });

  const loginScannerRef = useRef<Html5Qrcode | null>(null);
  const paymentScannerRef = useRef<Html5Qrcode | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || '{"user_id": "USR496713"}'); // Fallback for testing

  // ── 1. Cart Login Camera Scanning ───────────────────────────────
  useEffect(() => {
    if (isScanning && !isCheckingOut) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      loginScannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            await html5QrCode.stop();
            const qrData = JSON.parse(decodedText);
            processLogin(qrData.cart_id, qrData.store_id);
          } catch (err) {
            console.error("Invalid QR format", err);
          }
        },
        () => { /* Ignore read errors */ }
      ).catch((err) => console.error("Camera failed to start", err));

      return () => {
        if (loginScannerRef.current && loginScannerRef.current.isScanning) {
          loginScannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [isScanning, isCheckingOut]);

  const processLogin = async (cart_id: string, store_id: string) => {
    try {
      const res = await fetch(`${API_BASE}/cart/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, cart_id, store_id })
      });
      const data = await res.json();

      if (!data.error) {
        localStorage.setItem("cart_session", JSON.stringify(data));
        setIsScanning(false);
        setIsLinked(true);
        onCartLinked();
      } else {
        alert(data.error);
        setIsScanning(true);
      }
    } catch (err) {
      alert("Failed to connect to cart");
    }
  };

  // ── 2. Live Cart Polling ────────────────────────────────────────
  useEffect(() => {
    if (isLinked && !isCheckingOut) {
      const session = JSON.parse(localStorage.getItem("cart_session") || "{}");

      const fetchLiveCart = async () => {
        if (!session.cart_id) return;
        try {
          const res = await fetch(`${API_BASE}/cart/view/${session.cart_id}`);
          const data = await res.json();

          if (!data.error) {
            setCartItems(data.items || []);
            const tax = (data.total_price || 0) * 0.08;
            setCartSummary({ total_price: data.total_price || 0, tax });
          }
        } catch (err) {
          console.error("Failed to fetch live cart", err);
        }
      };

      fetchLiveCart();
      const interval = setInterval(fetchLiveCart, 3000);

      return () => clearInterval(interval);
    }
  }, [isLinked, isCheckingOut]);


  // ── 3. Checkout & Mock Payment Flow ─────────────────────────────

  // Start the payment camera once the checkout view is active
  useEffect(() => {
    if (isCheckingOut && !paymentDone) {
      const html5QrCode = new Html5Qrcode("payment-qr-reader");
      paymentScannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        () => { /* We ignore actual scans here since it's an auto-mock */ },
        () => { /* Ignore read errors */ }
      ).catch((err) => console.error("Payment camera failed", err));

      return () => {
        if (paymentScannerRef.current && paymentScannerRef.current.isScanning) {
          paymentScannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [isCheckingOut, paymentDone]);

  const handleCheckout = () => {
    // Instead of calling the /cart/checkout API here, 
    // we immediately navigate to the payment scanner view.
    // The physical cart UI will handle the 'locking' of the cart.
    setIsCheckingOut(true);

    // Since we are bypassing the API response on mobile, 
    // you may need to fetch the payment_id from your live cart polling 
    // or a specific endpoint if the cart UI has already generated it.
    // For the demo simulation:
    setTimeout(() => {
      completePaymentMock("DEMO_PAY_ID_123");
    }, 4000);
  };

  const completePaymentMock = async (paymentId: string) => {
    try {
      // Complete the mock payment to update DB records (Orders, Receipts, Loyalty Points)
      await fetch(`${API_BASE}/mock-payment/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: paymentId,
          status: "success",
          method: "upi",
          payer_ref: "DEMO_AUTO_SCAN_123"
        })
      });

      // Stop camera and show success screen
      if (paymentScannerRef.current && paymentScannerRef.current.isScanning) {
        await paymentScannerRef.current.stop();
      }

      setPaymentDone(true);

      // Clean up UI and return to previous screen
      setTimeout(() => {
        setIsCheckingOut(false);
        setPaymentDone(false);
        setIsLinked(false);
        localStorage.removeItem("cart_session"); // Clear session locally
        onBack();
      }, 2500);

    } catch (err) {
      console.error("Payment completion failed", err);
    }
  };

  // ── Views ───────────────────────────────────────────────────────

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

        <div className="flex-1 flex flex-col items-center justify-between px-6 py-4">
          <div className="text-center mb-4">
            <div className="w-12 h-20 bg-[#FF3347] rounded-xl flex items-center justify-center mx-auto mb-5">
              <Scan className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Scan Cart QR Code</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Point your camera at the QR code on your<br />shopping cart to link and sync items
            </p>
          </div>

          <div className="relative w-full overflow-hidden rounded-3xl" style={{ height: "300px" }}>
            <div id="qr-reader" className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-[#FF3347]/50 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[4px] border-l-[4px] border-[#FF3347] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[4px] border-r-[4px] border-[#FF3347] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[4px] border-l-[4px] border-[#FF3347] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[4px] border-r-[4px] border-[#FF3347] rounded-br-lg" />
              </div>
            </div>
          </div>

          {/* <div className="w-full space-y-3 mt-6">
            <Button onClick={() => processLogin("CART108", "STORE001")} className="w-full bg-secondary hover:bg-secondary/80 text-foreground rounded-xl h-12 text-base">
              Simulate Scan (CART108)
            </Button>
          </div> */}
        </div>
      </div>
    );
  }

  if (isCheckingOut) {
    const finalTotal = cartSummary.total_price + cartSummary.tax;

    return (
      <div className="h-full w-full flex flex-col bg-background">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
          <button disabled={paymentDone} onClick={() => setIsCheckingOut(false)} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border opacity-50">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">Payment</h2>
            <p className="text-xs text-muted-foreground">Scan to pay at the counter</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-6 py-8">
          {paymentDone ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div className="w-full h-full rounded-full bg-green-100 flex items-center justify-center mb-5" style={{ height: "68%" }}>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-2">Points have been added to your loyalty account 🎉</p>
              <p className="text-2xl font-bold text-[#FF3347] mt-4">₹{finalTotal.toFixed(2)}</p>
            </div>
          ) : (
            <>
              <div className="w-full bg-gradient-to-r from-[#FF3347] to-[#FF5566] rounded-2xl px-6 py-5 text-white mb-6">
                <p className="text-sm text-white/80">Total Amount Due</p>
                <p className="text-3xl font-bold mt-1">₹{finalTotal.toFixed(2)}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
                  <span>{cartItems.length} items</span>
                  <span>·</span>
                  <span>Cart ID: {JSON.parse(localStorage.getItem("cart_session") || "{}").cart_id}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 mb-2 text-[#FF3347]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm font-medium">Awaiting payment scan...</p>
                </div>

                {/* Payment Camera View */}
                <div className="relative w-full overflow-hidden rounded-3xl" style={{ height: "300px" }}>
                  <div id="payment-qr-reader" className="w-full h-full object-cover bg-gray-100" />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-green-500/50 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-[4px] border-l-[4px] border-green-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-[4px] border-r-[4px] border-green-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[4px] border-l-[4px] border-green-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[4px] border-r-[4px] border-green-500 rounded-br-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full mt-auto">
                <p className="text-center text-xs text-muted-foreground">Demo will auto-complete in a few seconds...</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const sessionData = JSON.parse(localStorage.getItem("cart_session") || "{}");

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">My Cart</h2>
          </div>
          {/* <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-700 font-medium">Live Sync</span>
          </div> */}
        </div>

        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Cart Linked Successfully</p>
            <p className="text-xs text-green-600">Cart ID: {sessionData.cart_id} · Syncing in real-time</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Cart Items</span>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
            <p className="text-xs text-muted-foreground mt-1">Drop items into the physical cart to see them here.</p>
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm leading-tight">{item.name}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 font-medium">
                    {item.weight_g}g
                  </span>
                  <span className="text-xs text-muted-foreground">Qty: {item.qty}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-foreground">₹{item.price.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-6 pt-4 pb-4 border-t border-border bg-card shrink-0">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal ({cartItems.length} items)</span>
            <span>₹{cartSummary.total_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-semibold text-[#FF3347]">₹{(cartSummary.total_price).toFixed(2)}</span>
          </div>
        </div>
        <Button
          onClick={handleCheckout}
          disabled={cartItems.length === 0}
          className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12 text-base"
        >
          Pay ₹{(cartSummary.total_price).toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
import { ArrowLeft, Scan, CheckCircle, ShoppingCart, Loader2, ScanLine } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";

const API_BASE = "http://192.168.2.22:8000";

interface CartScreenProps {
  onBack: () => void;
  isCartLinked: boolean;
  onCartLinked: () => void;
  onCartUnlinked: () => void;   // called after successful payment to reset homescreen
}

export function CartScreen({ onBack, isCartLinked, onCartLinked, onCartUnlinked }: CartScreenProps) {
  const [isScanning, setIsScanning] = useState(!isCartLinked);
  const [isLinked, setIsLinked] = useState(isCartLinked);

  // Payment flow states
  const [paymentSession, setPaymentSession] = useState<{
    pending: boolean; payment_id?: string; amount?: number; qr_payload?: string; order_id?: string;
  } | null>(null);
  const [isScanningPayment, setIsScanningPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Live Cart Data States
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartSummary, setCartSummary] = useState({ total_price: 0 });

  const loginScannerRef   = useRef<Html5Qrcode | null>(null);
  const paymentScannerRef = useRef<Html5Qrcode | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || '{"user_id": "USR496713"}');

  // ── 1. Cart Login Camera Scanning ───────────────────────────────
  useEffect(() => {
    if (isScanning) {
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
        () => {}
      ).catch((err) => console.error("Camera failed to start", err));

      return () => {
        if (loginScannerRef.current?.isScanning) {
          loginScannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [isScanning]);

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
    if (!isLinked || isScanningPayment || paymentDone) return;

    const session = JSON.parse(localStorage.getItem("cart_session") || "{}");

    const fetchLiveCart = async () => {
      if (!session.cart_id) return;
      try {
        const res  = await fetch(`${API_BASE}/cart/view/${session.cart_id}`);
        const data = await res.json();
        if (!data.error) {
          setCartItems(data.items || []);
          setCartSummary({ total_price: data.total_price || 0 });
        }
      } catch (err) {
        console.error("Failed to fetch live cart", err);
      }
    };

    fetchLiveCart();
    const interval = setInterval(fetchLiveCart, 3000);
    return () => clearInterval(interval);
  }, [isLinked, isScanningPayment, paymentDone]);

  // ── 3. Poll for active payment session on cart ────────────────
  // Only activates once cart is linked. When cart UI initiates checkout, this
  // will detect a pending payment and enable the "Pay" button.
  useEffect(() => {
    if (!isLinked || paymentDone) return;

    const session = JSON.parse(localStorage.getItem("cart_session") || "{}");
    if (!session.cart_id) return;

    const pollPaymentSession = async () => {
      try {
        const res  = await fetch(`${API_BASE}/cart/payment-session/${session.cart_id}`);
        const data = await res.json();
        setPaymentSession(data);
      } catch { /* silent */ }
    };

    pollPaymentSession();
    const interval = setInterval(pollPaymentSession, 3000);
    return () => clearInterval(interval);
  }, [isLinked, paymentDone]);

  // ── 4. Payment QR Scanner — scan the QR shown on the cart screen
  useEffect(() => {
    if (!isScanningPayment) return;

    const html5QrCode = new Html5Qrcode("payment-qr-reader");
    paymentScannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        try {
          await html5QrCode.stop();
          // The QR payload is: mockpay://pay?payment_id=PAY_xxx&amount=...
          // Extract payment_id from it
          let payId = paymentSession?.payment_id;
          try {
            const url = new URL(decodedText);
            const pid = url.searchParams.get("payment_id");
            if (pid) payId = pid;
          } catch {
            // fallback: try to parse as known format
            const match = decodedText.match(/payment_id=([^&]+)/);
            if (match) payId = match[1];
          }

          if (payId) {
            await completePayment(payId);
          } else {
            alert("Could not read payment ID from QR");
            setIsScanningPayment(false);
          }
        } catch (err) {
          console.error("QR scan error", err);
          setIsScanningPayment(false);
        }
      },
      () => {}
    ).catch((err) => {
      console.error("Payment camera failed", err);
      setIsScanningPayment(false);
    });

    return () => {
      if (paymentScannerRef.current?.isScanning) {
        paymentScannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanningPayment]);

  const completePayment = async (payId: string) => {
    try {
      const res = await fetch(`${API_BASE}/mock-payment/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payId,
          status: "success",
          method: "upi",
          payer_ref: `MOBILE_SCAN_${Date.now()}`
        })
      });
      const data = await res.json();

      if (data.message === "Payment successful" || data.status === "paid") {
        setIsScanningPayment(false);
        setPaymentDone(true);
        setPaymentSession(null);

        // Clear cart session and reset after 3 seconds
        setTimeout(() => {
          localStorage.removeItem("cart_session");
          setPaymentDone(false);
          setIsLinked(false);
          onCartUnlinked(); // tell parent to reset isCartLinked → false → back to homescreen
          onBack();
        }, 3000);
      } else {
        alert("Payment failed. Please try again.");
        setIsScanningPayment(false);
      }
    } catch (err) {
      console.error("Payment completion failed", err);
      setIsScanningPayment(false);
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
        </div>
      </div>
    );
  }

  // ── Payment QR Scanning view ─────────────────────────────────────
  if (isScanningPayment) {
    return (
      <div className="h-full w-full flex flex-col bg-background">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
          <button onClick={() => setIsScanningPayment(false)}
            className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">Scan Payment QR</h2>
            <p className="text-xs text-muted-foreground">Point at the QR shown on the cart screen</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-6 py-8">
          <div className="w-full bg-gradient-to-r from-[#FF3347] to-[#FF5566] rounded-2xl px-6 py-5 text-white mb-6">
            <p className="text-sm text-white/80">Scanning payment for</p>
            <p className="text-3xl font-bold mt-1">₹{paymentSession?.amount?.toFixed(2) ?? "..."}</p>
          </div>

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
          <p className="text-center text-xs text-muted-foreground mt-4">Scan the QR code displayed on the cart screen to complete payment</p>
        </div>
      </div>
    );
  }

  // ── Payment success view ─────────────────────────────────────────
  if (paymentDone) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-background px-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
        <p className="text-sm text-muted-foreground mt-2">Loyalty points have been added to your account 🎉</p>
        <p className="text-3xl font-bold text-[#FF3347] mt-4">₹{cartSummary.total_price.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-6">Returning to home…</p>
      </div>
    );
  }

  const sessionData = JSON.parse(localStorage.getItem("cart_session") || "{}");
  const hasPendingPayment = paymentSession?.pending === true;

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
            <span className="text-xl font-semibold text-[#FF3347]">₹{cartSummary.total_price.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button — only shown when cart UI has initiated checkout and payment session exists */}
        {hasPendingPayment ? (
          <Button
            onClick={() => setIsScanningPayment(true)}
            className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12 text-base flex items-center justify-center gap-2"
          >
            <ScanLine className="w-5 h-5" />
            Pay ₹{paymentSession?.amount?.toFixed(2) ?? cartSummary.total_price.toFixed(2)}
          </Button>
        ) : (
          <div className="w-full h-12 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {cartItems.length === 0
              ? "Add items to your cart"
              : "Waiting for checkout on cart screen…"}
          </div>
        )}
      </div>
    </div>
  );
}
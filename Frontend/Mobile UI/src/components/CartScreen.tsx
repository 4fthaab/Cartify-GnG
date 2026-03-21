import { ArrowLeft, Scan, CheckCircle, ShoppingCart, Loader2, ScanLine, Info, Package } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";

// --- 1. IMPORT AUDIO CORRECTLY ---
// This tells Vite to handle the path correctly regardless of where the app is hosted
import paymentTune from '../../assets/paytm_payment_tune.mp3';

const API_BASE = "http://10.211.103.220:8000";

interface CartScreenProps {
  onBack: () => void;
  isCartLinked: boolean;
  onCartLinked: () => void;
  onCartUnlinked: () => void;
}

export function CartScreen({ onBack, isCartLinked, onCartLinked, onCartUnlinked }: CartScreenProps) {
  const [isScanning, setIsScanning] = useState(!isCartLinked);
  const [isLinked, setIsLinked] = useState(isCartLinked);

  const [paymentSession, setPaymentSession] = useState<{
    pending: boolean; payment_id?: string; amount?: number; qr_payload?: string; order_id?: string;
  } | null>(null);
  const [isScanningPayment, setIsScanningPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartSummary, setCartSummary] = useState({ total_price: 0 });

  const loginScannerRef = useRef<Html5Qrcode | null>(null);
  const paymentScannerRef = useRef<Html5Qrcode | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || '{"user_id": "USR496713"}');

  const triggerHaptic = (type: 'light' | 'success' | 'warning') => {
    if (!("vibrate" in navigator)) return;
    switch (type) {
      case 'light': navigator.vibrate(10); break;
      case 'success': navigator.vibrate([30, 50, 30]); break;
      case 'warning': navigator.vibrate([100, 50, 100]); break;
    }
  };

  useEffect(() => {
    if (!isCartLinked) {
      setIsLinked(false);
      setIsScanning(true);
    }
  }, [isCartLinked]);

  // --- Scanning Logic ---
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
          } catch (err) { console.error("Invalid QR format", err); }
        },
        () => { }
      ).catch((err) => console.error("Camera failed to start", err));
      return () => { if (loginScannerRef.current?.isScanning) loginScannerRef.current.stop().catch(console.error); };
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
        triggerHaptic('success');
      } else {
        alert(data.error);
        setIsScanning(true);
      }
    } catch (err) { alert("Failed to connect to cart"); }
  };

  // --- Live Polling ---
  useEffect(() => {
    if (!isLinked || isScanningPayment || paymentDone) return;
    const session = JSON.parse(localStorage.getItem("cart_session") || "{}");
    const fetchLiveCart = async () => {
      if (!session.cart_id) return;
      try {
        const res = await fetch(`${API_BASE}/cart/display/${session.cart_id}`);
        const data = await res.json();
        if (data.status === "available" || data.linked_user_id !== user.user_id) {
          localStorage.removeItem("cart_session");
          onCartUnlinked();
          onBack();
          return;
        }
        if (!data.error) {
          setCartItems(data.items || []);
          setCartSummary({ total_price: data.total_price || 0 });
        }
      } catch (err) { console.error("Failed to fetch live cart", err); }
    };
    fetchLiveCart();
    const interval = setInterval(fetchLiveCart, 3000);
    return () => clearInterval(interval);
  }, [isLinked, isScanningPayment, paymentDone, user.user_id, onBack, onCartUnlinked]);

  useEffect(() => {
    if (!isLinked || paymentDone) return;
    const session = JSON.parse(localStorage.getItem("cart_session") || "{}");
    if (!session.cart_id) return;
    const pollPaymentSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/cart/payment-session/${session.cart_id}`);
        const data = await res.json();
        setPaymentSession(data);
      } catch { }
    };
    pollPaymentSession();
    const interval = setInterval(pollPaymentSession, 10000);
    return () => clearInterval(interval);
  }, [isLinked, paymentDone]);

  // --- Payment Camera ---
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
          let payId = paymentSession?.payment_id;
          try {
            const url = new URL(decodedText);
            const pid = url.searchParams.get("payment_id");
            if (pid) payId = pid;
          } catch {
            const match = decodedText.match(/payment_id=([^&]+)/);
            if (match) payId = match[1];
          }
          if (payId) await completePayment(payId);
          else { alert("Could not read payment ID from QR"); setIsScanningPayment(false); }
        } catch (err) { console.error("QR scan error", err); setIsScanningPayment(false); }
      },
      () => { }
    ).catch((err) => { console.error("Payment camera failed", err); setIsScanningPayment(false); });
    return () => { if (paymentScannerRef.current?.isScanning) paymentScannerRef.current.stop().catch(console.error); };
  }, [isScanningPayment, paymentSession]);

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
      } else { alert("Payment failed. Please try again."); setIsScanningPayment(false); }
    } catch (err) { console.error("Payment completion failed", err); setIsScanningPayment(false); }
  };

  // --- 2. IMPROVED SUCCESS EFFECT ---
  useEffect(() => {
    if (paymentDone) {
      // Trigger Haptics
      triggerHaptic('success');

      // Play Sound Safely
      try {
        const audio = new Audio(paymentTune);
        audio.volume = 0.6;
        audio.play().catch(e => console.log("Audio auto-play blocked or missing:", e));
      } catch (err) {
        console.error("Audio system error:", err);
      }

      // Auto-redirect after 4 seconds
      const timer = setTimeout(() => {
        localStorage.removeItem("cart_session");
        setPaymentDone(false);
        setIsScanning(true);
        setIsLinked(false);
        onCartUnlinked();
        onBack();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [paymentDone, onBack, onCartUnlinked]);

  // --- Render Views ---

  if (isScanning) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col bg-background">
        <div className="px-6 py-6 flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <button onClick={onBack} className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center border border-border shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Link Your Cart</h2>
            <p className="text-sm text-muted-foreground font-medium">Identify your physical cart</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 gap-10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-[#FF3347] rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-[#FF3347]/20 rotate-3 animate-pulse">
              <Scan className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Ready to Scan?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                Align the QR code on the physical cart handle within the frame.
              </p>
            </div>
          </div>

          <div className="relative w-full aspect-square max-w-[320px] overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-card">
            <div id="qr-reader" className="w-full h-full object-cover bg-slate-900" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-[#FF3347]/30 rounded-3xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[5px] border-l-[5px] border-[#FF3347] rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[5px] border-r-[5px] border-[#FF3347] rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[5px] border-l-[5px] border-[#FF3347] rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[5px] border-r-[5px] border-[#FF3347] rounded-br-2xl" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full border border-border">
            <Info className="w-4 h-4 text-[#FF3347]" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Environment Mode Active</p>
          </div>
        </div>
      </div>
    );
  }

  if (isScanningPayment) {
    return (
      // 1. Fixed Layout: Changed 'h-screen' to 'h-full flex-1' to fit inside App.tsx
      <div className="h-full flex-1 w-full flex flex-col bg-background overflow-hidden">

        {/* Header */}
        <div className="px-6 py-6 flex items-center gap-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-md z-10">
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsScanningPayment(false);
            }}
            className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center border border-border active:scale-90 transition-transform shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Checkout</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Secure Payment Gateway</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8 overflow-hidden">

          {/* QR Scanner Frame */}
          <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-[1.5rem] shadow-2xl bg-black border-[6px] border-card shrink-0">
            <div id="payment-qr-reader" className="w-full h-full object-cover opacity-80" />

            {/* Visual Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-scan-loop" />
              <div className="flex items-center justify-center h-full">
                <div className="w-64 h-64 border border-green-500/30 rounded-3xl relative">
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-green-500 rounded-tl-2xl" />
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-green-500 rounded-tr-2xl" />
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-green-500 rounded-bl-2xl" />
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-green-500 rounded-br-2xl" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs font-semibold text-muted-foreground leading-relaxed px-6 opacity-60 pb-4">
            Center the QR code from the <span className="text-foreground font-bold">Smart Cart Screen</span> within the frame to finalize your purchase.
          </p>
        </div>
      </div>
    );
  }

  if (paymentDone) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background px-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-20" />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-red-400 rounded-full animate-bounce opacity-20" />
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-20" />
        </div>

        <div className="relative mb-10">
          <div className="w-64 h-64 rounded-full bg-green-500/10 flex items-center justify-center relative z-10 scale-110 mt-8">
            <CheckCircle className="w-16 h-16 text-green-500 animate-in zoom-in duration-500 fill-green-500/20" />
          </div>
          <div className="absolute inset-0 bg-green-500/30 rounded-full animate-ping duration-[2000ms] -z-10" />
        </div>

        <div className="space-y-4 max-w-[280px]">
          <h3 className="text-4xl font-black text-foreground tracking-tighter italic">SUCCESS!</h3>
          <div className="h-1 w-12 bg-[#FF3347] mx-auto rounded-full" />
          <p className="text-sm text-muted-foreground font-bold leading-relaxed uppercase tracking-wider">
            Transaction Complete
          </p>
          <p className="text-xs text-muted-foreground/60">
            Your items are cleared. Thank you for using <span className="text-[#FF3347] font-bold">Grab n Go</span>!
          </p>
        </div>

        <div className="mt-12 bg-card border border-border rounded-[2.5rem] p-8 w-full shadow-2xl relative">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Amount Paid</p>
          <p className="text-xl font-black text-foreground tracking-tighter">
            ₹{cartSummary.total_price.toFixed(0)}<span className="text-xl text-[#FF3347]">.{cartSummary.total_price.toFixed(2).split('.')[1]}</span>
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-green-600 font-bold text-[11px] uppercase tracking-widest">
            <Package className="w-4 h-4" />
            <span>You may CHeckout the Items</span>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-3">
          <div className="w-48 h-1.5 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-[#FF3347] animate-progress-fill" />
          </div>
        </div>
      </div>
    );
  }

  const sessionData = JSON.parse(localStorage.getItem("cart_session") || "{}");
  const hasPendingPayment = paymentSession?.pending === true;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">
      <div className="px-6 pt-6 pb-4 shrink-0 bg-background sticky top-0 z-10 border-b border-border">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={onBack} className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center border border-border shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">My Cart</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Sync Active</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 bg-green-500/5 border border-green-500/20 rounded-[1.5rem] p-4">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-green-900 leading-tight">Live Session Connected</p>
            <p className="text-[10px] text-green-700 font-mono mt-0.5 truncate uppercase">ID: {sessionData.cart_id}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#FF3347]" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Current Items</span>
          </div>
          <span className="text-[10px] font-bold bg-accent border border-border px-3 py-1 rounded-full uppercase text-muted-foreground">{cartItems.length} Total</span>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-accent/20 rounded-[2rem] border border-dashed border-border mx-2">
            <div className="mt-4 w-16 h-16 bg-background rounded-full flex items-center justify-center border border-border">
              <ShoppingCart className="w-8 h-8 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-1 px-4">
              <p className="text-base font-bold text-foreground/80">Empty Session</p>
              <p className="mb-4 text-xs text-muted-foreground font-medium leading-relaxed">
                Items added to your physical smart cart will appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-card border border-border rounded-[1.5rem] p-4 shadow-sm hover:border-[#FF3347]/30 transition-colors">
                <div className="w-14 h-14 bg-accent/50 rounded-2xl flex items-center justify-center shrink-0 border border-border">
                  <Package className="w-7 h-7 text-[#FF3347]/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm uppercase tracking-tight truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] bg-[#FF3347]/10 text-[#FF3347] rounded-md px-2 py-0.5 font-bold uppercase tracking-tighter">
                      {item.weight_g}g
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground">QTY × {item.qty}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-black text-foreground text-base tracking-tighter">₹{item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-6 border-t border-border bg-card/80 backdrop-blur-xl shrink-0 space-y-6">
        <div className="space-y-3 px-2">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Bill Summary</span>
            <span className="font-mono">{cartItems.length} Item(s)</span>
          </div>
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-sm font-bold text-foreground">Final Payable Amount</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium text-[#FF3347]">₹</span>
              <span className="text-3xl font-black text-[#FF3347] tracking-tighter">{cartSummary.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {hasPendingPayment ? (
          <Button
            onClick={() => setIsScanningPayment(true)}
            className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-2xl h-14 text-base font-bold shadow-xl shadow-[#FF3347]/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <ScanLine className="w-6 h-6" />
            Process Checkout
          </Button>
        ) : (
          <div className="w-full h-14 flex items-center justify-center bg-accent/50 rounded-2xl border border-border border-dashed text-muted-foreground font-bold text-sm gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF3347]" />
            {cartItems.length === 0
              ? "Scanning for Items..."
              : "Wait for Checkout Command"}
          </div>
        )}
      </div>
    </div>
  );
}
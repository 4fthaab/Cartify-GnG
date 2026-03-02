import { useState, useEffect, useRef, useCallback } from "react";
import { LoginScreen } from "@/components/CartInterface/LoginScreen";
import { MinimapSearch } from "@/components/CartInterface/MinimapSearch";
import { MainInterface } from "@/components/CartInterface/MainInterface";
import { BillingScreen } from "@/components/CartInterface/BillingScreen";
import { PaymentScreen } from "@/components/CartInterface/PaymentScreen";

const INACTIVITY_MS = 60_000; // 1 minute

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Inactivity reset: only active on screens 3+ (after login / main interface)
  const resetInactivity = useCallback(() => {
    if (currentScreen < 3) return; // only care about billing/payment/receipt screens
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      // Reset to login screen after 1 minute of inactivity
      localStorage.removeItem("cart_user");
      setCurrentScreen(0);
    }, INACTIVITY_MS);
  }, [currentScreen]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetInactivity));
    resetInactivity(); // start timer on screen change
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivity]);

  const goTo = (screen: number) => setCurrentScreen(screen);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Horizontal sliding container */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentScreen * 100}%)` }}
      >
        {/* Screen 0 – Login / QR display */}
        <div className="min-w-full h-full">
          <LoginScreen onNext={() => goTo(2)} />
        </div>

        {/* Screen 1 – Minimap/Search */}
        <div className="min-w-full h-full">
          <MinimapSearch
            onNext={() => goTo(2)}
            onLogout={() => goTo(0)}
          />
        </div>

        {/* Screen 2 – Main Shopping Interface */}
        <div className="min-w-full h-full">
          <MainInterface
            onBack={() => goTo(1)}
            onCheckout={() => goTo(3)}
          />
        </div>

        {/* Screen 3 – Billing Screen (select payment method) */}
        <div className="min-w-full h-full">
          <BillingScreen
            onBack={() => goTo(2)}
            onDone={(method) => {
              setPaymentMethod(method);
              if (method === "upi") {
                goTo(4); // QR payment screen
              } else {
                // Cash: go directly to receipt (checkout API called from PaymentScreen)
                // For cash we still go through PaymentScreen which handles the checkout call
                goTo(4);
              }
            }}
          />
        </div>

        {/* Screen 4 – Payment Screen (calls /cart/checkout, shows QR, polls status) */}
        <div className="min-w-full h-full">
          <PaymentScreen
            paymentMethod={paymentMethod}
            onBack={() => goTo(3)}
            onDone={() => {
              // Receipt shown inside PaymentScreen via ReceiptScreen component.
              // After receipt → 1 min inactivity handled above, or user can reset manually.
              // Navigate back to login after receipt is dismissed.
              localStorage.removeItem("cart_user");
              goTo(0);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
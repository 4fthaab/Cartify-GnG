import { useState, useEffect, useRef, useCallback } from "react";
import { LoginScreen } from "@/components/CartInterface/LoginScreen";
import { MinimapSearch } from "@/components/CartInterface/MinimapSearch";
import { MainInterface } from "@/components/CartInterface/MainInterface";
import { BillingScreen } from "@/components/CartInterface/BillingScreen";
import { PaymentScreen } from "@/components/CartInterface/PaymentScreen";
import { RatingScreen } from "@/components/CartInterface/RatingScreen"; // 1. Import new screen
import { HelpModal } from "@/components/CartInterface/HelpModal"; // 2. Import Help Modal

const INACTIVITY_MS = 60_000; // 1 minute

interface PaymentData {
  payment_id: string;
  amount: number;
  order_id: string;
  qr_payload: string;
  method: string;
}
// const [checkoutData, setCheckoutData] = useState<{ items: any[], total: number }>({ items: [], total: 0 });
const Index = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recentlyAddedItem, setRecentlyAddedItem] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<{ items: any[], total: number }>({ items: [], total: 0 });
  
  const resetInactivity = useCallback(() => {
    // Only care about billing/payment/receipt/rating screens
    if (currentScreen < 3) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      localStorage.removeItem("cart_user");
      setCurrentScreen(0);
    }, INACTIVITY_MS);
  }, [currentScreen]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetInactivity));
    resetInactivity();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivity]);

  const goTo = (screen: number) => setCurrentScreen(screen);

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* 3. Drop in the Global Help Modal outside the sliding container */}
      <HelpModal />

      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentScreen * 100}%)` }}
      >
        <div className="min-w-full h-full">
          <LoginScreen 
             isActive={currentScreen === 0}
             onNext={() => goTo(2)} 
          />
        </div>
        {/* Screen 1 – Minimap/Search */}
        <div className="min-w-full h-full">
          <MinimapSearch 
            onNext={(itemName?: string) => { 
              if (itemName) setRecentlyAddedItem(itemName);
              goTo(2); 
            }} 
          />
        </div>
        {/* Screen 2 – Main Shopping Interface */}
        <div className="min-w-full h-full">
          <MainInterface
            onBack={() => goTo(1)}
            onRouteReady={() => goTo(1)}
            recentlyAddedItem={recentlyAddedItem}                  //  Pass it down
            clearRecentlyAdded={() => setRecentlyAddedItem(null)}
            onCheckout={(items, total) => {
              setCheckoutData({ items, total }); // Save the items here
              goTo(3);
            }}
            isPollingPaused={currentScreen >= 3}
          />
        </div>

        {/* Screen 3 – Billing Screen */}
        <div className="min-w-full h-full">
          <BillingScreen
            cartItems={checkoutData.items}     //  Inject items
            totalAmount={checkoutData.total}   //  Inject total
            onBack={() => goTo(2)}
            onDone={(data) => {
              setPaymentData(data);
              goTo(4);
            }}
          />
        </div>
        <div className="min-w-full h-full">
          {paymentData ? (
            <PaymentScreen
              paymentData={paymentData}
              onBack={() => goTo(3)}
              onDone={() => goTo(5)} // 4. Change this from goTo(0) to goTo(5) to show Rating Screen
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-50">
              <p className="text-slate-500 animate-pulse">Loading payment details...</p>
            </div>
          )}
        </div>

        {/* 5. Add the new Rating Screen as Screen 5 */}
        <div className="min-w-full h-full">
          <RatingScreen
            onDone={() => {
              // Final cleanup before looping back to the start
              localStorage.removeItem("cart_user");
              setPaymentData(null);
              goTo(0);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
// import { useState, useEffect, useRef, useCallback } from "react";
// import { LoginScreen } from "@/components/CartInterface/LoginScreen";
// import { MinimapSearch } from "@/components/CartInterface/MinimapSearch";
// import { MainInterface } from "@/components/CartInterface/MainInterface";
// import { BillingScreen } from "@/components/CartInterface/BillingScreen";
// import { PaymentScreen } from "@/components/CartInterface/PaymentScreen";

// const INACTIVITY_MS = 60_000; // 1 minute

// // Add an interface for the new payment data structure
// interface PaymentData {
//   payment_id: string;
//   amount: number;
//   order_id: string;
//   qr_payload: string;
//   method:string;
// }

// const Index = () => {
//   const [currentScreen, setCurrentScreen] = useState(0);
//   // Update state to hold the full payment data object
//   const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
//   const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // ── Inactivity reset: only active on screens 3+ (after login / main interface)
//   const resetInactivity = useCallback(() => {
//     if (currentScreen < 3) return; // only care about billing/payment/receipt screens
//     if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
//     inactivityTimer.current = setTimeout(() => {
//       // Reset to login screen after 1 minute of inactivity
//       localStorage.removeItem("cart_user");
//       setCurrentScreen(0);
//     }, INACTIVITY_MS);
//   }, [currentScreen]);

//   useEffect(() => {
//     const events = ["mousemove", "keydown", "touchstart", "click"];
//     events.forEach(e => window.addEventListener(e, resetInactivity));
//     resetInactivity(); // start timer on screen change
//     return () => {
//       events.forEach(e => window.removeEventListener(e, resetInactivity));
//       if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
//     };
//   }, [resetInactivity]);

//   const goTo = (screen: number) => setCurrentScreen(screen);

//   return (
//     <div className="relative w-full h-screen overflow-hidden">
//       {/* Horizontal sliding container */}
//       <div
//         className="flex h-full transition-transform duration-700 ease-in-out"
//         style={{ transform: `translateX(-${currentScreen * 100}%)` }}
//       >
//         {/* Screen 0 – Login / QR display */}
//         <div className="min-w-full h-full">
//           <LoginScreen onNext={() => goTo(2)} />
//         </div>

//         {/* Screen 1 – Minimap/Search */}
//         <div className="min-w-full h-full">
//           <MinimapSearch
//             onNext={() => goTo(2)}
//             onLogout={() => goTo(0)}
//           />
//         </div>

//         {/* Screen 2 – Main Shopping Interface */}
//         <div className="min-w-full h-full">
//           <MainInterface
//             onBack={() => goTo(1)}
//             onCheckout={() => goTo(3)}
//           />
//         </div>

//         {/* Screen 3 – Billing Screen (creates payment session) */}
//         <div className="min-w-full h-full">
//           <BillingScreen
//             onBack={() => goTo(2)}
//             onDone={(data) => {
//               // Store the full payment data object
//               setPaymentData(data);
//               goTo(4);
//             }}
//           />
//         </div>

//         {/* Screen 4 – Payment Screen (shows QR, polls status) */}
//         <div className="min-w-full h-full">
//           {paymentData ? (
//             <PaymentScreen
//               paymentData={paymentData}
//               onBack={() => goTo(3)}
//               onDone={() => {
//                 // Navigate back to login after receipt is dismissed
//                 localStorage.removeItem("cart_user");
//                 setPaymentData(null); // Clear state securely
//                 goTo(0);
//               }}
//             />
//           ) : (
//             // Fallback while transitioning or if data is missing
//             <div className="flex items-center justify-center h-full bg-slate-50">
//               <p className="text-slate-500 animate-pulse">Loading payment details...</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Index;
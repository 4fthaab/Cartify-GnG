import { useState } from "react";
import { LoginScreen } from "@/components/CartInterface/LoginScreen";
import { MinimapSearch } from "@/components/CartInterface/MinimapSearch";
import { MainInterface } from "@/components/CartInterface/MainInterface";
import { BillingScreen } from "@/components/CartInterface/BillingScreen";
import { PaymentScreen } from "@/components/CartInterface/PaymentScreen";
import { ReceiptScreen } from "@/components/CartInterface/ReceiptScreen";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const purchasedItems = [
    { name: "RICE", quantity: "10 Kg", price: 45 },
    { name: "OIL", quantity: "2 Kg", price: 100 },
    { name: "SHAMPOO", quantity: "1", price: 3 },
    { name: "SOAP", quantity: "3", price: 9 },
  ];

  const screens = [
    <LoginScreen onNext={() => setCurrentScreen(2)} />,
    <MinimapSearch
      onNext={() => setCurrentScreen(2)}
      onLogout={() => setCurrentScreen(0)}
    />,
    <MainInterface
      onBack={() => setCurrentScreen(1)}
      onCheckout={() => setCurrentScreen(3)}
    />,
    <BillingScreen
      onBack={() => setCurrentScreen(2)}
      onDone={(method) => {
        setPaymentMethod(method);

        if (method === "upi") {
          setCurrentScreen(4);  // QR screen index
        } else {
          setCurrentScreen(5);  // Receipt screen index
        }
      }}
    />,
    <PaymentScreen
      total={187}  // you can pass dynamic total later
      onBack={() => setCurrentScreen(0)}
    />,
    <ReceiptScreen
      items={purchasedItems}
      total={187}
      paymentMethod={paymentMethod || "cash"}
      paymentId={
        paymentMethod === "cash"
          ? `CASH-${Date.now()}`
          : `UPI-${Date.now()}`
      }
      onDone={() => setCurrentScreen(0)}
    />
  ];



  return (

    <div className="relative w-full h-screen overflow-hidden">
      {/* Horizontal sliding container */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentScreen * 100}%)` }}
      >
        {screens.map((screen, index) => (
          <div key={index} className="min-w-full h-full">
            {screen}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;

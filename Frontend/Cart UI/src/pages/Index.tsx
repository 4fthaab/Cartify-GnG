import { useState } from "react";
import { LoginScreen } from "@/components/CartInterface/LoginScreen";
import { MinimapSearch } from "@/components/CartInterface/MinimapSearch";
import { MainInterface } from "@/components/CartInterface/MainInterface";
import { BillingScreen } from "@/components/CartInterface/BillingScreen";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    <LoginScreen onNext={() => setCurrentScreen(1)} />,
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
      onDone={() => setCurrentScreen(0)}
    />,
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

import { QrCode, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";

interface LoginScreenProps {
  onNext: () => void;
  isActive?: boolean;
}

export const LoginScreen = ({ onNext, isActive = true }: LoginScreenProps) => {
  const [cartId] = useState("CART103");
  const [storeId] = useState("STORE001");
  
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://10.211.103.220:8000/cart/status/${cartId}`
        );
        const data = await res.json();

        if (data.assigned) {
          localStorage.setItem("cart_user", JSON.stringify(data.user));
          clearInterval(interval);
          onNext();
        }
      } catch (err) {
        console.error("Status check failed");
      }
    }, 2000);

    // 4. Cleanup the interval when the screen becomes inactive
    return () => clearInterval(interval);
    
  // 5. Add isActive to the dependency array
  }, [isActive, cartId]);

  const qrData = JSON.stringify({
    cart_id: "CART103",
    store_id: "STORE001"
  });
return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-glow/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Reduced gap-8 to gap-4 (sm:gap-6) to save vertical space */}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 md:gap-8 px-4 text-center w-full max-w-md">
        
        {/* Logo/Brand */}
        <div className="animate-scale-in shrink-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">ABC SUPERMARKET</h1>
          <p className="text-white/80 text-sm md:text-lg">Smart Shopping Experience</p>
        </div>

        {/* QR Scan Section */}
        <div className="animate-fade-in delay-200 w-full flex flex-col items-center">
          <div className="relative flex flex-col items-center w-full">

            {/* Glow Background */}
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>

            {/* Main QR Card - Reduced padding from p-10 to p-6 */}
            <div className="relative w-full max-w-[320px] bg-white/90 backdrop-blur-xl p-6 sm:p-8 mb-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col items-center">

              <div className="p-3 bg-white rounded-2xl shadow-inner">
                {/* Scaled down QR code from 230 to 180 so it fits on Pi screens */}
                <QRCodeCanvas value={qrData} size={180} />
              </div>

              <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-slate-800">
                Scan to Connect
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Cart ID: <span className="font-medium">{cartId}</span>
              </p>

              {/* Waiting Animation */}
              <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 text-cyan-600 text-xs sm:text-sm">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
                Waiting for connection...
              </div>

            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={onNext}
            className="w-full max-w-[320px] bg-white/20 hover:bg-white/30 border-white/40 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 h-11 sm:h-12"
          >
            <UserCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Login as Guest
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="animate-fade-in delay-300">
          <p className="text-white/60 text-xs sm:text-sm max-w-[280px] sm:max-w-md mx-auto leading-tight">
            Scan the QR code with your mobile app to link your account, or continue as a guest
          </p>
        </div>
      </div>
    </div>
  );
};

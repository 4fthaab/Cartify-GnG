import { QrCode, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";

interface LoginScreenProps {
  onNext: () => void;
}

export const LoginScreen = ({ onNext }: LoginScreenProps) => {
  const [cartId] = useState("CART109");
  const [storeId] = useState("STORE001");
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://192.168.2.22:8000/cart/status/${cartId}`
        );
        const data = await res.json();

        if (data.assigned) {
          // Save to cart device localStorage
          localStorage.setItem(
            "cart_user",
            JSON.stringify(data.user)
          );

          clearInterval(interval);
          onNext(); // move to Minimap or MainInterface
        }
      } catch (err) {
        console.error("Status check failed");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const qrData = JSON.stringify({
    cart_id: "CART109",
    store_id: "STORE001"
  });
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-glow/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo/Brand */}
        <div className="animate-scale-in">
          <h1 className="text-4xl font-bold text-white mb-2">Cartify GnG</h1>
          <p className="text-white/80 text-lg">Smart Shopping Experience</p>
        </div>

        {/* QR Scan Section */}
        <div className="animate-fade-in delay-200">
          <div className="relative flex flex-col items-center">

            {/* Glow Background */}
            <div className="absolute w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>

            {/* Main QR Card */}
            <div className="relative bg-white/90 backdrop-blur-xl px-8 py-4 mb-2 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col items-center">

              <div className="p-4 bg-white rounded-2xl shadow-inner">
                <QRCodeCanvas value={qrData} size={230} />
              </div>

              <h3 className="mt-2 text-xl font-semibold text-slate-800">
                Scan to Connect
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Cart ID: <span className="font-medium">{cartId}</span>
              </p>

              Waiting Animation
              <div className="flex items-center gap-2 mx-4 text-cyan-600 text-sm">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
                Waiting for mobile connection...
              </div>

            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={onNext}
            className="w-full bg-white/20 hover:bg-white/30 border-white/40 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            <UserCircle className="mr-2 h-5 w-5" />
            Login as Guest
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="animate-fade-in delay-300">
          <p className="text-white/60 text-sm max-w-md">
            Scan the QR code with your mobile app to link your account, or continue as a guest
          </p>
        </div>
      </div>
    </div>
  );
};

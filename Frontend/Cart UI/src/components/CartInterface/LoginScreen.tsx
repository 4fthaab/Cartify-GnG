import { QrCode, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginScreenProps {
  onNext: () => void;
}

export const LoginScreen = ({ onNext }: LoginScreenProps) => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-glow/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
        {/* Logo/Brand */}
        <div className="animate-scale-in">
          <h1 className="text-4xl font-bold text-white mb-2">ABC SUPERMARKET</h1>
          <p className="text-white/80 text-lg">Smart Shopping Experience</p>
        </div>

        {/* QR Scan Section */}
        <div className="animate-fade-in delay-200">
          <div className="bg-white/90 backdrop-blur-glass rounded-2xl p-8 shadow-glow mb-6">
            <div className="w-48 h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
              <QrCode className="w-32 h-32 text-primary" />
            </div>
            <p className="text-foreground font-semibold text-lg">SCAN QR TO LOGIN</p>
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

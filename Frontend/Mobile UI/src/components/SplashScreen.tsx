import { ShoppingCart } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="h-full bg-gradient-to-br from-[#FF3347] to-[#FF5566] flex flex-col items-center justify-center gap-8 p-8">
      <div className="relative">
        <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
          <ShoppingCart className="w-16 h-16 text-[#FF3347]" strokeWidth={2} />
        </div>
      </div>
      <h1 className="text-white text-4xl">Grab N Go</h1>
      <p className="text-white/80 text-center">Your Smart Shopping Companion</p>
    </div>
  );
}

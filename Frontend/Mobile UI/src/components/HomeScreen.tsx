import { Search, ShoppingCart, Menu, ListChecks, Gift, Sun, Moon, AlertCircle, ClockArrowUp, CreditCard, Scan, LogOut } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useState, useEffect } from 'react';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  cartItems: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isCartLinked: boolean;
}

const API_BASE = "http://localhost:8000";

export function HomeScreen({ onNavigate, cartItems, isDarkMode, onToggleTheme, isCartLinked }: HomeScreenProps) {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [offerBanners, setOfferBanners] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_BASE}/offers/all`);
        const data = await res.json();

        if (data.offers) {
          // Map backend fields to UI format
          const mappedOffers = data.offers.map((offer: any) => ({
            title: offer.title,
            subtitle: offer.description || "Limited time offer",
            color: "from-purple-500 to-pink-500", // fallback UI color
            emoji: "🔥"
          }));

          setOfferBanners(mappedOffers);
        }
      } catch (err) {
        console.error("Failed to fetch offers", err);
      }
      setLoadingOffers(false);
    };

    fetchOffers();
  }, []);

  // ── Logout Logic ────────────────────────────────────────────────
  const handleLogout = async () => {
    const cartSession = JSON.parse(localStorage.getItem("cart_session") || "{}");

    // 1. If a cart is linked, log out of it on the backend
    if (cartSession.cart_id) {
      try {
        await fetch(`${API_BASE}/cart/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartSession.cart_id }) //
        });
      } catch (err) {
        console.error("Failed to logout cart on backend", err);
      }
    }

    // 2. Clear local storage to reset user state
    localStorage.removeItem("user");
    localStorage.removeItem("cart_session");

    // 3. Navigate back to Splash Screen instead of Login directly
    // This will show the "Cartify" intro animation again
    onNavigate('splash');
  };
  
  const quickActions = [
    { icon: ListChecks, label: 'Shopping List', screen: 'list' },
    { icon: ShoppingCart, label: 'My Cart', screen: 'cart', badge: cartItems },
    { icon: Gift, label: 'Offers', screen: 'offers' }
  ];

  const menuItems = [
    {
      icon: AlertCircle,
      iconBg: 'bg-[#FF3347]/10',
      iconColor: 'text-[#FF3347]',
      label: 'Report an Issue',
      sublabel: 'Let us know about problems',
      action: () => onNavigate('report'),
    },
    {
      icon: ClockArrowUp,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      label: 'Recent Orders',
      sublabel: 'View your order history',
      action: () => onNavigate('orders'),
    },
    {
      icon: CreditCard,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      label: 'Payment History',
      sublabel: 'Browse past payments',
      action: () => onNavigate('payments'),
    },
    {
      icon: LogOut,
      iconBg: 'bg-gray-500/10',
      iconColor: 'text-gray-500',
      label: 'Logout',
      sublabel: 'Sign out and unlink cart',
      action: handleLogout,
    },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl text-foreground">
              Hello, {storedUser?.name || "Shopper"}!
            </h2>
            <p className="text-sm text-muted-foreground">Time to grab your favorites 🛍️</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors border border-border"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors border border-border">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card border-border p-1">
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-3 p-3 cursor-pointer rounded-xl"
                  >
                    <div className={`w-10 h-10 ${item.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isCartLinked && (
          <div className="px-6 pt-6">
            <Card
              onClick={() => onNavigate('cart')}
              className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-0 p-6 rounded-2xl cursor-pointer relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white">Link Your Cart</h3>
                  <Scan className="w-6 h-6 text-white" />
                </div>
                <div className="w-full aspect-[3/2] bg-indigo-500/30 rounded-xl flex items-center justify-center my-4 relative backdrop-blur-sm">
                  <div className="absolute inset-4 border-2 border-transparent rounded-xl">
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center w-full">
                    <p className="text-white text-sm">Tap to scan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">5x</span>
                  </div>
                  <p className="text-white/90 text-sm">Earn 5x points when you link your cart</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="px-6 py-6">
          <h3 className="mb-4 text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button key={action.screen} onClick={() => onNavigate(action.screen)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow relative border border-border">
                  <action.icon className="w-6 h-6 text-[#FF3347]" />
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-[#FF3347] text-white min-w-5 h-5 flex items-center justify-center p-1 text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-center text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="mb-4 text-foreground">Today's Offers</h3>
          <div className="grid grid-cols-1 gap-3">
            {offerBanners.map((offer, index) => (
              <Card
                key={index}
                className={`bg-gradient-to-r ${offer.color} border-0 p-5 rounded-2xl cursor-pointer`}
                onClick={() => onNavigate('offers')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white mb-1">{offer.title}</h4>
                    <p className="text-white/90 text-sm">{offer.subtitle}</p>
                  </div>
                  <div className="text-4xl">{offer.emoji}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
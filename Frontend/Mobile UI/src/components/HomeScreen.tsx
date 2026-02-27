import { Search, ShoppingCart, Menu, ListChecks, Gift, HelpCircle, Sun, Moon, MessageCircle, FileQuestion, AlertCircle, Scan } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useState } from 'react';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  cartItems: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isCartLinked: boolean;
}

export function HomeScreen({ onNavigate, cartItems, isDarkMode, onToggleTheme, isCartLinked }: HomeScreenProps) {
  const quickActions = [
    { icon: ListChecks, label: 'Shopping List', screen: 'list' },
    { icon: ShoppingCart, label: 'My Cart', screen: 'cart', badge: cartItems },
    { icon: Gift, label: 'Offers', screen: 'offers' }
  ];

  const offerBanners = [
    { title: '50% OFF', subtitle: 'On dairy products', color: 'from-purple-500 to-pink-500', emoji: '🥛' },
    { title: 'Price Drop', subtitle: 'Fresh vegetables', color: 'from-green-500 to-emerald-500', emoji: '🥬' },
    { title: 'Buy 2 Get 1', subtitle: 'Bakery items', color: 'from-orange-500 to-amber-500', emoji: '🍞' },
  ];

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl text-foreground">Hello, Shopper!</h2>
            <p className="text-sm text-muted-foreground">Time to grab your favorites 🛍️</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={onToggleTheme}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors border border-border"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-foreground" />
              )}
            </button>
            
            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-10 h-10 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors border border-border"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card border-border">
                <DropdownMenuItem 
                  onClick={() => onNavigate('help')}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-[#FF3347]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-[#FF3347]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Help / Assist</p>
                    <p className="text-xs text-muted-foreground mt-1">Chat with our support team</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-[#FF3347]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileQuestion className="w-5 h-5 text-[#FF3347]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">FAQ</p>
                    <p className="text-xs text-muted-foreground mt-1">Frequently asked questions</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-[#FF3347]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-[#FF3347]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Report an Issue</p>
                    <p className="text-xs text-muted-foreground mt-1">Let us know about problems</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Button */}
            <button
              onClick={() => onNavigate('help')}
              className="w-10 h-10 bg-[#FF3347] text-white rounded-full flex items-center justify-center hover:bg-[#FF5566] transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search products..."
            className="pl-10 bg-input-background border-0 rounded-xl h-12"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cart Login QR Card (only shown if cart not linked) */}
        {!isCartLinked && (
          <div className="px-6 pt-6">
            <Card 
              onClick={() => onNavigate('cart')}
              className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-0 p-6 rounded-2xl cursor-pointer relative overflow-hidden"
            >
              {/* Stars Background */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.8 + 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white">Link Your Cart</h3>
                  <Scan className="w-6 h-6 text-white" />
                </div>

                {/* QR Frame */}
                <div className="w-full aspect-[3/2] bg-indigo-500/30 rounded-xl flex items-center justify-center my-4 relative backdrop-blur-sm">
                  <div className="absolute inset-4 border-2 border-transparent rounded-xl">
                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                    
                    {/* QR Pattern Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-3">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="w-8 h-8 bg-indigo-400/40 rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tap to Scan */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                    <p className="text-white text-sm">Tap to scan</p>
                  </div>
                </div>

                {/* Benefits */}
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

        {/* Quick Actions */}
        <div className="px-6 py-6">
          <h3 className="mb-4 text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.screen}
                onClick={() => onNavigate(action.screen)}
                className="flex flex-col items-center gap-2 group"
              >
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

        {/* Today's Offers */}
        <div className="px-6 pb-6">
          <h3 className="mb-4 text-foreground">Today's Offers</h3>
          <div className="grid grid-cols-1 gap-3">
            {offerBanners.map((offer, index) => (
              <Card 
                key={index}
                className={`bg-gradient-to-r ${offer.color} border-0 p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform`}
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

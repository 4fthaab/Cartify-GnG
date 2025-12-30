import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { QRLoginScreen } from './components/QRLoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ShoppingListScreen } from './components/ShoppingListScreen';
import { CartScreen } from './components/CartScreen';
import { OffersScreen } from './components/OffersScreen';
import { HelpScreen } from './components/HelpScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [cartItems, setCartItems] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCartLinked, setIsCartLinked] = useState(false);

  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen('qr-login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleLogin = () => {
    setCurrentScreen('home');
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    setCurrentScreen('home');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleCartLinked = () => {
    setIsCartLinked(true);
    setCartItems(3); // Sync cart items count
    // Return to home after a brief delay
    setTimeout(() => {
      setCurrentScreen('home');
    }, 500);
  };

  return (
    <div className="size-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      {/* iPhone 16 Pro Frame - 393x852px */}
      <div className={`w-full max-w-[393px] h-full max-h-[852px] bg-background shadow-2xl rounded-[3rem] overflow-hidden relative ${isDarkMode ? 'dark' : ''}`}>
        {currentScreen === 'splash' && <SplashScreen />}
        {currentScreen === 'qr-login' && <QRLoginScreen onLogin={handleLogin} />}
        {currentScreen === 'home' && (
          <HomeScreen 
            onNavigate={handleNavigate} 
            cartItems={cartItems} 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme}
            isCartLinked={isCartLinked}
          />
        )}
        {currentScreen === 'list' && <ShoppingListScreen onBack={handleBack} />}
        {currentScreen === 'cart' && (
          <CartScreen 
            onBack={handleBack} 
            isCartLinked={isCartLinked}
            onCartLinked={handleCartLinked}
          />
        )}
        {currentScreen === 'offers' && <OffersScreen onBack={handleBack} />}
        {currentScreen === 'help' && <HelpScreen onBack={handleBack} />}
      </div>
    </div>
  );
}

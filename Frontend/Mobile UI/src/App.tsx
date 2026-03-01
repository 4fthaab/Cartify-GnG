import { useState, useEffect } from 'react';
import { QRLoginScreen } from './components/QRLoginScreen';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { ShoppingListScreen } from './components/ShoppingListScreen';
import { CartScreen } from './components/CartScreen';
import { OffersScreen } from './components/OffersScreen';
import { ReportIssueModal } from './components/ReportIssueModal';
import { RecentOrdersScreen } from './components/RecentOrdersScreen';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [cartItems, setCartItems] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCartLinked, setIsCartLinked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Restore session
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Splash screen first
  if (!isSplashDone) {
    return <SplashScreen onFinish={() => setIsSplashDone(true)} />;
  }

  // If not logged in → show login screen
  if (!user) {
    return <QRLoginScreen onLogin={(loggedUser) => setUser(loggedUser)} />;
  }

  // Navigation handler
  const handleNavigate = (screen: string) => {
    if (screen === 'report') {
      setShowReportModal(true);
    } else if (screen === 'splash') {
      // ── LOGOUT SEQUENCE ──
      setUser(null);              // Clear user state (triggers login screen later)
      setIsSplashDone(false);     // Show the splash screen immediately
      setCurrentScreen('home');   // Reset the background screen to home
      setIsCartLinked(false);     // Unlink cart in UI
      setCartItems(0);            // Reset cart items badge
    }
    else {
      setCurrentScreen(screen);
    }
  };

  const handleBack = () => setCurrentScreen('home');
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleCartLinked = () => {
    setIsCartLinked(true);
    setCartItems(3);
    setTimeout(() => setCurrentScreen('home'), 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a2b3c]">
      <div className={`w-[393px] h-[852px] bg-background shadow-2xl rounded-[3rem] overflow-hidden relative flex flex-col ${isDarkMode ? 'dark' : ''}`}>

        {currentScreen === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            cartItems={cartItems}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            isCartLinked={isCartLinked}
          />
        )}

        {currentScreen === 'list' && (
          <ShoppingListScreen onBack={handleBack} />
        )}

        {currentScreen === 'cart' && (
          <CartScreen
            onBack={handleBack}
            isCartLinked={isCartLinked}
            onCartLinked={handleCartLinked}
          />
        )}

        {currentScreen === 'offers' && (
          <OffersScreen onBack={handleBack} />
        )}

        {currentScreen === 'orders' && (
          <RecentOrdersScreen onBack={handleBack} />
        )}

        {currentScreen === 'payments' && (
          <PaymentHistoryScreen onBack={handleBack} />
        )}

        {showReportModal && (
          <ReportIssueModal onClose={() => setShowReportModal(false)} />
        )}

      </div>
    </div>
  );
}
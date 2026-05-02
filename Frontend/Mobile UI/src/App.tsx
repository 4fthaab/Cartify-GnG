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
  const [isCartLinked, setIsCartLinked] = useState<boolean>(() => {
    //checking if cart session exist or not.
    return localStorage.getItem("cart_session") !== null;
  }); 
  const [showReportModal, setShowReportModal] = useState(false);

  //Restore session
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // intial loading splash screen
  if (!isSplashDone) {
    return <SplashScreen onFinish={() => setIsSplashDone(true)} />;
  }

  if (!user) {
    return <QRLoginScreen onLogin={(loggedUser) => setUser(loggedUser)} />;
  }

  //Navigation handler
  const handleNavigate = (screen: string) => {
    if (screen === 'report') {
      setShowReportModal(true);
    } else if (screen === 'splash') {              //Logout section
      setUser(null);              
      setIsSplashDone(false);     
      setCurrentScreen('home');   
      setIsCartLinked(false);    
      setCartItems(0);            
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
    <div className={`w-full min-h-[100dvh] bg-background flex flex-col ${isDarkMode ? 'dark' : ''}`}>

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
          onCartUnlinked={() => setIsCartLinked(false)} 
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
  );
}
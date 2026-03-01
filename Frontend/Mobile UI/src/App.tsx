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
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [cartItems, setCartItems] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCartLinked, setIsCartLinked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);



  const handleNavigate = (screen: string) => {
    if (screen === 'report') {
      setShowReportModal(true);
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleBack = () => setCurrentScreen('home');
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const handleCartLinked = () => {
    setIsCartLinked(true);
    setCartItems(3);
    setTimeout(() => setCurrentScreen('home'));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a2b3c]">
      <div className={`w-[393px] h-[852px] bg-background shadow-2xl rounded-[3rem] overflow-hidden relative flex flex-col ${isDarkMode ? 'dark' : ''}`}>

        {currentScreen === 'splash' && (
          <div className="flex-1 min-h-0"><SplashScreen onFinish={() => setCurrentScreen('qr-login')} /></div>
        )}
        {currentScreen === 'qr-login' && (
          <div className="flex-1 min-h-0"><QRLoginScreen onLogin={() => setCurrentScreen('home')} /></div>
        )}
        {currentScreen === 'home' && (
          <div className="flex-1 min-h-0">
            <HomeScreen onNavigate={handleNavigate} cartItems={cartItems} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} isCartLinked={isCartLinked} />
          </div>
        )}
        {currentScreen === 'list' && (
          <div className="flex-1 min-h-0"><ShoppingListScreen onBack={handleBack} /></div>
        )}
        {currentScreen === 'cart' && (
          <div className="flex-1 min-h-0"><CartScreen onBack={handleBack} isCartLinked={isCartLinked} onCartLinked={handleCartLinked} /></div>
        )}
        {currentScreen === 'offers' && (
          <div className="flex-1 min-h-0"><OffersScreen onBack={handleBack} /></div>
        )}
        {currentScreen === 'orders' && (
          <div className="flex-1 min-h-0"><RecentOrdersScreen onBack={handleBack} /></div>
        )}
        {currentScreen === 'payments' && (
          <div className="flex-1 min-h-0"><PaymentHistoryScreen onBack={handleBack} /></div>
        )}

        {/* Modal overlay */}
        {showReportModal && <ReportIssueModal onClose={() => setShowReportModal(false)} />}

      </div>
    </div>
  );
}
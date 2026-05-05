import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminService } from '../services/adminServices';

interface AuthContextType {
  isAuthenticated: boolean;
  adminData: any;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminData');
    if (token && storedAdmin) {
      setIsAuthenticated(true);
      setAdminData(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await adminService.login(email, password);
    
    if (data.status === 'success') {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify(data.admin));
      setIsAuthenticated(true);
      setAdminData(data.admin);
      return { success: true };
    }
    
    return { success: false, message: data.message };
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsAuthenticated(false);
    setAdminData(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminData, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
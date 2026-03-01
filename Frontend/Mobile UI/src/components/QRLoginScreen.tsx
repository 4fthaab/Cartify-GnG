import { Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';

const API_BASE = "http://localhost:8000";

interface QRLoginScreenProps {
  onLogin: (user: any) => void;
}

export function QRLoginScreen({ onLogin }: QRLoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const payload: any = { password };

        if (emailOrPhone.includes("@")) {
          payload.email = emailOrPhone;
        } else {
          payload.phone = emailOrPhone;
        }

        const res = await fetch(`${API_BASE}/user/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.status === "success") {
          localStorage.setItem("user", JSON.stringify(data));
          onLogin(data);
        } else {
          setError(data.message || "Login failed");
        }

      } else {
        // SIGNUP
        const payload: any = {
          name,
          password
        };

        if (emailOrPhone.includes("@")) {
          payload.email = emailOrPhone;
        } else {
          payload.phone = emailOrPhone;
        }

        const res = await fetch(`${API_BASE}/user/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.status === "success") {
          setIsLogin(true);
          setError("Account created! Please login.");
        } else {
          setError(data.message || "Signup failed");
        }
      }

    } catch (err) {
      setError("Server error. Make sure backend is running.");
    }

    setLoading(false);
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-24 h-24 bg-[#FF3347] rounded-2xl flex items-center justify-center mb-4">
          <span className="text-white text-4xl">🛒</span>
        </div>
        
        <h2 className="text-2xl text-center text-foreground">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>

        <div className="w-full max-w-sm space-y-4 mt-4">

          {/* Name (Only for Signup) */}
          {!isLogin && (
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
            />
          )}

          {/* Email or Phone */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Email or Phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="pl-12 h-12 rounded-xl"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-12 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setError("");
                setIsLogin(!isLogin);
              }}
              className="text-[#FF3347]"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
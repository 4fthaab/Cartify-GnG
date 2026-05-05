import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';

const API_BASE = "http://10.211.103.220:8000";

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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Validation Helpers
  const isValidEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  const isValidPhone = (str: string) => /^\d{10}$/.test(str);

  const handleAuth = async () => {
    setAttemptedSubmit(true);
    setError("");

    // Frontend Validation

    // Checking for Empty Fields
    if (!emailOrPhone || !password || (!isLogin && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    //Signup Constraints
    if (!isLogin) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      if (!isValidEmail(emailOrPhone) && !isValidPhone(emailOrPhone)) {
        setError("Please enter a valid email or a 10-digit phone number.");
        return;
      }
    }

    //Backend API Call
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
          setAttemptedSubmit(false);
          setPassword(""); // Clear password for login
          setError("Account created! Please sign in.");
        } else {
          setError(data.message || "Signup failed");
        }
      }

    } catch (err) {
      setError("Server error. Make sure backend is running.");
    }

    setLoading(false);
  };

  // UI Helpers
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setAttemptedSubmit(false); // Reset red borders when switching modes
  };

  // Determine if a field should have a red border
  const getBorderClass = (fieldValue: string, isFieldInvalid?: boolean) => {
    const baseClass = "h-12 rounded-xl transition-colors";
    const errorClass = "border-red-500 focus-visible:ring-red-500";

    // Show red if submitted and field is empty or fails at specific validation
    if (attemptedSubmit && (!fieldValue || isFieldInvalid)) {
      return `${baseClass} ${errorClass}`;
    }
    return baseClass;
  };
  const isEmailPhoneInvalid = !isLogin && attemptedSubmit && emailOrPhone ? (!isValidEmail(emailOrPhone) && !isValidPhone(emailOrPhone)) : false;
  const isPasswordInvalid = !isLogin && attemptedSubmit && password ? password.length < 8 : false;

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-24 h-24 bg-[#FF3347] rounded-2xl flex items-center justify-center mb-4">
          <span className="text-white text-4xl">🛒</span>
        </div>

        <h2 className="text-2xl text-center text-foreground font-semibold">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>

        <div className="w-full max-w-sm space-y-4 mt-4">

          {/* Name Field for Signup*/}
          {!isLogin && (
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={getBorderClass(name)}
            />
          )}

          {/* Email or Phone Field */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Email or 10-digit Phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className={`pl-12 ${getBorderClass(emailOrPhone, isEmailPhoneInvalid)}`}
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={isLogin ? "Password" : "Password (min. 8 characters)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-12 pr-12 ${getBorderClass(password, isPasswordInvalid)}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error Message Display */}
          {error && (
            <p className="text-red-500 text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl h-12 font-medium transition-colors"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          {/* Toggle Login/Signup */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleAuthMode}
              className="text-[#FF3347] font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
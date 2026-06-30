import React, { useState } from "react";
import { User, Mail, Sparkles, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";

interface SignInScreenProps {
  onSignIn: (name: string, email: string) => void;
}

export default function SignInScreen({ onSignIn }: SignInScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time validation checks for password complexity
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName || undefined,
          email: trimmedEmail,
          password: password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSignIn(data.user.name, data.user.email);
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setError("Network or connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl transition-all">
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md mb-4">
            <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            Community Hero
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-medium">
            Civic Tech Platform & Overlapping Jurisdiction Routing
          </p>
        </div>

        {/* Informational Message */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 leading-relaxed space-y-1.5">
          <span className="font-bold flex items-center gap-1 text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Secure Password Authentication
          </span>
          <p className="text-blue-700 font-medium leading-normal">
            New here? Introduce yourself with your Full Name, Email, and create a secure password to sign up. Returning hero? Just enter your Email and Password (the Name field is ignored for existing accounts).
          </p>
        </div>

        {/* Input Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name-input" className="block text-[10.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Full Name (Required for Sign Up)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="name-input"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="e.g. Priya Sharma (leave blank if logging in)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email-input" className="block text-[10.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email-input"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="e.g. citizen@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-input" className="block text-[10.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password complexity feedback checklist */}
          {password && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password Strength Checklist</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  {checks.length ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">✓ <span className="text-slate-600">8+ Characters</span></span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">○ <span className="text-slate-500">8+ Characters</span></span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {checks.uppercase ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">✓ <span className="text-slate-600">1+ Uppercase</span></span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">○ <span className="text-slate-500">1+ Uppercase</span></span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {checks.lowercase ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">✓ <span className="text-slate-600">1+ Lowercase</span></span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">○ <span className="text-slate-500">1+ Lowercase</span></span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {checks.number ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">✓ <span className="text-slate-600">1+ Number</span></span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">○ <span className="text-slate-500">1+ Number</span></span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] col-span-2">
                  {checks.special ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">✓ <span className="text-slate-600">1+ Special Character (@$!%*?& etc.)</span></span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">○ <span className="text-slate-500">1+ Special Character (@$!%*?& etc.)</span></span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                isLoading ? "opacity-75 cursor-wait" : ""
              }`}
            >
              {isLoading ? "Authenticating..." : "Enter Community Portal"}
            </button>
          </div>
        </form>

        {/* Footer branding details */}
        <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100">
          A project by civic-minded citizens of Gurugram.
        </div>
      </div>
    </div>
  );
}

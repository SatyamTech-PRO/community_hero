import React, { useState } from "react";
import { User, Mail, Sparkles, ShieldCheck } from "lucide-react";

interface SignInScreenProps {
  onSignIn: (name: string, email: string) => void;
}

export default function SignInScreen({ onSignIn }: SignInScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    onSignIn(trimmedName, trimmedEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl transition-all">
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
          <span className="font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Identity Capture (No Password)
          </span>
          <p>
            Please introduce yourself. Your name will be used to attribute issue reports and "I see this too" validations publicly on the portal. No password is required.
          </p>
        </div>

        {/* Input Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold animate-pulse">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name-input" className="block text-[10.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="name-input"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="e.g. Priya Sharma"
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

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Enter Community Portal
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

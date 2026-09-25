"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Compass, Anchor, ShieldCheck } from "@/components/icons";
import { parseIIITLEmail } from '@/lib/email';
import { motion } from 'framer-motion';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [boarding, setBoarding] = useState(false);

  const handleDevLogin = (presetEmail?: string, presetName?: string) => {
    setBoarding(true);
    signIn('dev-mock-auth', {
      email: presetEmail || email,
      name: presetName || name,
      callbackUrl: '/dashboard',
    });
  };

  const handleGoogleLogin = () => {
    setBoarding(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const parsed = email ? parseIIITLEmail(email) : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center"
      >
        {/* Subtle Ambient Light Shimmer */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        
        {/* Crest Avatar */}
        <div className="flex justify-center mb-4 relative">
          <div className="w-20 h-20 rounded-2xl border-2 border-amber-400 bg-black/70 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.35)]">
            <Compass className="w-10 h-10 text-amber-400 animate-[spin_12s_linear_infinite]" />
          </div>
        </div>

        {/* Identity Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Anchor className="w-3.5 h-3.5 text-amber-400" />
          <span>Sign In</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] mb-1.5">
          Welcome Aboard
        </h1>
        <p className="text-xs font-code text-white/60 mb-6">
          Sign in with your college account to get started
        </p>

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={boarding}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] text-sm disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{boarding ? "Signing in..." : "Continue with Google"}</span>
        </button>

        {/* Development Area */}
        <div className="border-t border-white/10 pt-6 mt-6">
          <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-amber-400/90 mb-3">
            Dev Access
          </h2>
          
          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              onClick={() => handleDevLogin('lit2026001@iiitl.ac.in', 'Fresher Sailor')}
              disabled={boarding}
              className="p-2.5 bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-white text-xs font-code font-bold rounded-xl transition disabled:opacity-50"
            >
              Fresher &apos;26
            </button>
            <button
              onClick={() => handleDevLogin('lit2024001@iiitl.ac.in', 'Senior Quartermaster')}
              disabled={boarding}
              className="p-2.5 bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-white text-xs font-code font-bold rounded-xl transition disabled:opacity-50"
            >
              Senior &apos;24
            </button>
            <button
              onClick={() => handleDevLogin('admin@iiitl.ac.in', 'The Commodore')}
              disabled={boarding}
              className="p-2.5 bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-white text-xs font-code font-bold rounded-xl transition disabled:opacity-50"
            >
              Organizer
            </button>
          </div>

          <div className="space-y-3 text-left">
            <div>
              <input
                type="email"
                placeholder="College Email (lit2026000@iiitl.ac.in)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={boarding}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 font-sans font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 text-sm"
              />
              {email && (
                <div className="mt-1.5 text-xs font-code">
                  {parsed ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Valid: {parsed.branch.toUpperCase()} &apos;{parsed.batchYear} ({parsed.rollNumber})
                    </span>
                  ) : (
                    <span className="text-red-400">Must follow IIITL email format</span>
                  )}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={boarding}
              className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 font-sans font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 text-sm"
            />

            <button
              onClick={() => handleDevLogin()}
              disabled={!email || !name || boarding}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-sans font-black uppercase tracking-wider text-sm shadow-[0_0_16px_rgba(251,191,36,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              Manual Override
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

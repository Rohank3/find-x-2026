"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Compass } from 'lucide-react';
import { parseIIITLEmail } from '@/lib/email';
import { motion } from 'framer-motion';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleDevLogin = (presetEmail?: string, presetName?: string) => {
    signIn('dev-mock-auth', {
      email: presetEmail || email,
      name: presetName || name,
      callbackUrl: '/dashboard',
    });
  };

  const parsed = email ? parseIIITLEmail(email) : null;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-voyage-ocean/20 border-2 border-voyage-gold/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-voyage-gold to-transparent" />
        
        <div className="flex justify-center mb-6 relative">
          <Compass className="w-16 h-16 text-voyage-gold animate-[spin_10s_linear_infinite]" />
        </div>
        
        <h1 className="text-4xl text-center font-pirata text-voyage-gold mb-8">Board the Ship</h1>

        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors mb-8 text-base"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="border-t border-voyage-gold/20 pt-6">
          <h2 className="text-sm font-code text-voyage-gold-light mb-4 uppercase tracking-wider text-center">Development Area</h2>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => handleDevLogin('lit2026001@iiitl.ac.in', 'Fresher Sailor')}
              className="px-2 py-2 bg-voyage-oak/40 border border-voyage-gold/30 hover:bg-voyage-oak/60 text-voyage-parchment text-xs font-code rounded transition"
            >
              Fresher &apos;26
            </button>
            <button
              onClick={() => handleDevLogin('lit2024001@iiitl.ac.in', 'Senior Quartermaster')}
              className="px-2 py-2 bg-voyage-oak/40 border border-voyage-gold/30 hover:bg-voyage-oak/60 text-voyage-parchment text-xs font-code rounded transition"
            >
              Senior &apos;24
            </button>
            <button
              onClick={() => handleDevLogin('admin@iiitl.ac.in', 'The Commodore')}
              className="px-2 py-2 bg-voyage-oak/40 border border-voyage-gold/30 hover:bg-voyage-oak/60 text-voyage-parchment text-xs font-code rounded transition"
            >
              Organizer
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Custom Email (lit2026000@iiitl.ac.in)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-voyage-abyss border border-voyage-gold/30 rounded px-4 py-2 font-code text-voyage-parchment focus:outline-none focus:border-voyage-gold text-base"
              />
              {email && (
                <div className="mt-2 text-xs font-code">
                  {parsed ? (
                    <span className="text-green-400">Valid: {parsed.branch.toUpperCase()} &apos;{parsed.batchYear} ({parsed.rollNumber})</span>
                  ) : (
                    <span className="text-voyage-crimson">Invalid IIITL format</span>
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-voyage-abyss border border-voyage-gold/30 rounded px-4 py-2 font-code text-voyage-parchment focus:outline-none focus:border-voyage-gold text-base"
            />
            <button
              onClick={() => handleDevLogin()}
              disabled={!email || !name}
              className="w-full bg-voyage-gold/20 border border-voyage-gold hover:bg-voyage-gold/30 text-voyage-gold font-code py-2 rounded transition disabled:opacity-50"
            >
              Manual Override
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

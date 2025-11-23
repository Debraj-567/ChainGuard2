
import React, { useState } from 'react';
import { Loader2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate Auth Delay and Profile Creation
    setTimeout(() => {
      const namePart = email.split('@')[0];
      // Capitalize first letter and clean up dots/underscores
      const cleanName = namePart.replace(/[._]/g, ' ');
      const name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      
      const mockUser: User = {
        name: name,
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full border border-slate-700 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">ChainReturn AI</h1>
            <p className="text-slate-400">Secure, Blockchain-Verified Returns</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-bold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 ${(!email || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Secure Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="text-center mt-6">
                <p className="text-xs text-slate-500">
                    Authenticating via 
                    <span className="text-slate-400 font-medium"> ChainID Secure Gateway</span>
                </p>
                <p className="text-[10px] text-slate-600 mt-2">
                    By continuing, you agree to receive Smart Contracts via email.
                </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

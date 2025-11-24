
import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, Github, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-theme-surface w-full max-w-md rounded-2xl shadow-2xl border border-theme-border overflow-hidden animate-slide-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-muted hover:text-theme-text transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-blue-500/20">
                    F
                </div>
                <h2 className="text-2xl font-bold text-theme-text">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-theme-muted text-sm mt-1">
                    {isLogin ? 'Enter your credentials to access FinInsight.' : 'Start your financial intelligence journey.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={18} />
                        <input 
                            type="text" 
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-10 pr-4 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all"
                            required
                        />
                    </div>
                )}
                
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={18} />
                    <input 
                        type="email" 
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-10 pr-4 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all"
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={18} />
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-10 pr-4 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all"
                        required
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-theme-accent hover:bg-theme-accent/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-2"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-theme-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-theme-surface px-2 text-theme-muted">Or continue with</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-2.5 border border-theme-border rounded-xl hover:bg-theme-bg transition-colors text-sm font-medium text-theme-text">
                    <Chrome size={18} /> Google
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 border border-theme-border rounded-xl hover:bg-theme-bg transition-colors text-sm font-medium text-theme-text">
                    <Github size={18} /> GitHub
                </button>
            </div>

            <p className="text-center mt-6 text-sm text-theme-muted">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-theme-accent font-bold hover:underline"
                >
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

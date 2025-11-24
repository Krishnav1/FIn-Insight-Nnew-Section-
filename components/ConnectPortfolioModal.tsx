
import React, { useState, useEffect } from 'react';
import { X, Smartphone, ShieldCheck, Database, CheckCircle2, Loader2, Lock } from 'lucide-react';

interface ConnectPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

const ConnectPortfolioModal: React.FC<ConnectPortfolioModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [otp, setOtp] = useState('');
  const [fetchStatus, setFetchStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if(phone.length >= 10 && pan.length >= 10) setStep(2);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if(otp.length === 6) {
        setStep(3);
        startSimulation();
    }
  };

  const startSimulation = () => {
    const statuses = [
        "Connecting to Account Aggregator...",
        "Verifying PAN with NSDL...",
        "Fetching Holdings from CDSL...",
        "Analyzing Asset Allocation...",
        "Syncing with FinInsight..."
    ];

    let i = 0;
    const interval = setInterval(() => {
        setFetchStatus(statuses[i]);
        i++;
        if (i >= statuses.length) {
            clearInterval(interval);
            setTimeout(() => {
                setStep(4);
            }, 800);
        }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-theme-surface w-full max-w-md rounded-2xl shadow-2xl border border-theme-border overflow-hidden animate-slide-up">
        {step < 3 && (
            <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-theme-muted hover:text-theme-text transition-colors z-10"
            >
            <X size={20} />
            </button>
        )}

        {/* Header Image/Icon */}
        <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-xl">
                {step === 1 && <Smartphone size={32} />}
                {step === 2 && <ShieldCheck size={32} />}
                {step === 3 && <Database size={32} className="animate-pulse" />}
                {step === 4 && <CheckCircle2 size={32} />}
            </div>
        </div>

        <div className="p-8">
            {/* Step 1: Input Details */}
            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-theme-text text-center mb-2">Link Your Portfolio</h2>
                    <p className="text-sm text-theme-muted text-center mb-6">
                        FinInsight uses AA (Account Aggregator) framework to safely fetch your holdings from NSDL/CDSL.
                    </p>
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-theme-muted uppercase mb-1">Mobile Number</label>
                            <input 
                                type="tel" 
                                placeholder="+91 98765 43210"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-theme-muted uppercase mb-1">PAN Number</label>
                            <input 
                                type="text" 
                                placeholder="ABCDE1234F"
                                value={pan}
                                onChange={e => setPan(e.target.value.toUpperCase())}
                                className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent uppercase"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-theme-accent hover:bg-theme-accent/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 mt-2">
                            Send OTP
                        </button>
                    </form>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-theme-muted">
                        <Lock size={12} />
                        <span>Bank-grade 256-bit encryption</span>
                    </div>
                </div>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
                <div className="animate-fade-in">
                     <h2 className="text-xl font-bold text-theme-text text-center mb-2">Verify OTP</h2>
                     <p className="text-sm text-theme-muted text-center mb-6">
                        Enter the 6-digit code sent to {phone}
                    </p>
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="• • • • • •"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent font-mono"
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-theme-accent hover:bg-theme-accent/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 mt-2">
                            Verify & Link
                        </button>
                    </form>
                    <button onClick={() => setStep(1)} className="w-full text-center text-xs text-theme-accent font-bold mt-4 hover:underline">
                        Change Mobile Number
                    </button>
                </div>
            )}

            {/* Step 3: Simulation Loader */}
            {step === 3 && (
                <div className="text-center py-8 animate-fade-in">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-theme-border"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-theme-accent border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-bold text-theme-text mb-2">Syncing Portfolio...</h3>
                    <p className="text-sm text-theme-muted font-mono">{fetchStatus}</p>
                </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
                 <div className="text-center py-4 animate-fade-in">
                    <h2 className="text-2xl font-bold text-theme-text mb-2">Portfolio Linked!</h2>
                    <p className="text-theme-muted mb-8">
                        We successfully fetched your holdings from NSDL. FinGenie is now analyzing your positions.
                    </p>
                    <button 
                        onClick={onConnected}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                    >
                        Go to Dashboard
                    </button>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ConnectPortfolioModal;

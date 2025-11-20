import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface Step {
  targetId: string; // Can be ID or Class name
  title: string;
  content: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updatePosition = useCallback(() => {
    if (!isOpen) return;
    const step = steps[currentStep];
    
    // If no target (e.g., welcome screen), clear rect
    if (!step.targetId) {
        setTargetRect(null);
        return;
    }

    // Try finding by ID first, then by class (returns first match)
    const element = document.getElementById(step.targetId) || document.querySelector(`.${step.targetId}`);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTargetRect(element.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isOpen, steps]);

  useEffect(() => {
    updatePosition();
    // Update on resize and scroll to keep spotlight aligned
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  // Allow DOM to settle before positioning
  useEffect(() => {
      if(isOpen) {
          const timer = setTimeout(updatePosition, 500);
          return () => clearTimeout(timer);
      }
  }, [currentStep, isOpen, updatePosition]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // Calculate tooltip position
  const getTooltipStyle = () => {
      if (!targetRect) {
          // Center if no target
          return {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
          };
      }

      // Default: Below the element
      let top = targetRect.bottom + 20;
      // Center horizontally relative to target, but constrain to screen edges
      let left = targetRect.left + (targetRect.width / 2) - 160; // 160 is half of max-w-xs (roughly)

      // Constrain horizontal
      const maxLeft = window.innerWidth - 340; // padding
      left = Math.max(20, Math.min(left, maxLeft));

      // Check vertical overflow
      if (top + 200 > window.innerHeight) {
          // Flip to top if bottom overflows
          top = targetRect.top - 220; 
      }

      return { top, left };
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
        {/* Dimmed Background */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-500" />

        {/* Spotlight Highlighting (Cutout Effect using Box Shadow) */}
        {targetRect && (
            <div 
                className="absolute transition-all duration-500 ease-[cubic-bezier(0.25,0.4,0.55,1.4)] border-2 border-blue-500/50 rounded-lg pointer-events-none"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)'
                }}
            />
        )}

        {/* Tooltip Card */}
        <div 
            className="absolute transition-all duration-500 ease-out flex flex-col w-[320px]"
            style={getTooltipStyle()}
        >
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-fade-in relative">
                {/* Arrow (Simplified) */}
                
                <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-bold">
                            {currentStep + 1}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{step.title}</h3>
                     </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={16} />
                    </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm leading-relaxed">
                    {step.content}
                </p>

                <div className="flex justify-between items-center">
                    <button 
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentStep === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Back
                    </button>
                    
                    <div className="flex gap-1.5">
                        {steps.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`} />
                        ))}
                    </div>

                    <button 
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-blue-200 dark:shadow-none"
                    >
                        {isLastStep ? "Let's Go!" : 'Next'}
                        {!isLastStep && <ChevronRight size={12} />}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingTour;
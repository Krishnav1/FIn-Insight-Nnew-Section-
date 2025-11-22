
import React from 'react';

interface FocusWrapperProps {
  children: React.ReactNode;
  onFocusChange: (focused: boolean) => void;
  isFocused?: boolean; // Global state
}

const FocusWrapper: React.FC<FocusWrapperProps> = ({ children, onFocusChange, isFocused }) => {
  return (
    <div 
        onMouseEnter={() => onFocusChange(true)}
        onMouseLeave={() => onFocusChange(false)}
        className={`transition-all duration-500 ${isFocused ? 'scale-[1.02] z-20 relative' : 'z-0'}`}
    >
      {children}
    </div>
  );
};

export default FocusWrapper;

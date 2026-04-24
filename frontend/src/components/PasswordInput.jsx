import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

const PasswordInput = ({ className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition" size={18} />
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={`${className} pl-11 pr-12`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-gray-400 hover:text-emerald-600 transition"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
'use client';

import { useTheme } from './Providers';

export default function Logo() {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {theme === 'dark' ? (
          <>
            {/* Dark version - Cyan book icon */}
            <rect x="20" y="20" width="88" height="88" rx="8" fill="none" />
            <path
              d="M32 32 L64 20 L96 32 L96 96 L64 108 L32 96 L32 32 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              className="text-cyan-400"
            />
            <circle cx="50" cy="50" r="3" fill="currentColor" className="text-cyan-400" />
            <circle cx="78" cy="50" r="3" fill="currentColor" className="text-cyan-400" />
            <circle cx="50" cy="70" r="3" fill="currentColor" className="text-cyan-400" />
            <circle cx="78" cy="70" r="3" fill="currentColor" className="text-cyan-400" />
            <path d="M50 85 L78 85" stroke="currentColor" strokeWidth="2" className="text-cyan-400" />
          </>
        ) : (
          <>
            {/* Light version - Dark blue book icon */}
            <rect x="20" y="20" width="88" height="88" rx="8" fill="none" />
            <path
              d="M32 32 L64 20 L96 32 L96 96 L64 108 L32 96 L32 32 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              className="text-blue-600"
            />
            <circle cx="50" cy="50" r="3" fill="currentColor" className="text-blue-600" />
            <circle cx="78" cy="50" r="3" fill="currentColor" className="text-blue-600" />
            <circle cx="50" cy="70" r="3" fill="currentColor" className="text-blue-600" />
            <circle cx="78" cy="70" r="3" fill="currentColor" className="text-blue-600" />
            <path d="M50 85 L78 85" stroke="currentColor" strokeWidth="2" className="text-blue-600" />
          </>
        )}
      </svg>
      <span className="text-lg font-bold tracking-wider">
        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Edu</span>
        <span className={theme === 'dark' ? 'text-cyan-400' : 'text-cyan-500'}>AI</span>
      </span>
    </div>
  );
}

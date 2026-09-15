import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'full' | 'switch-only';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  if (variant === 'switch-only') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDarkMode}
        onClick={toggleTheme}
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700 focus:ring-blue-500'
            : 'bg-teal-600 border border-teal-500 focus:ring-teal-400'
        } ${className}`}
        title={isDarkMode ? 'Đang bật Dark Mode. Nhấn để chuyển sang Light Mode Teal/Mint' : 'Đang ở Light Mode Teal/Mint. Nhấn để chuyển sang Dark Mode'}
      >
        <span className="sr-only">Bật/tắt chế độ tối</span>
        <span
          className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
            isDarkMode ? 'translate-x-0 text-slate-800' : 'translate-x-7 text-teal-700'
          }`}
        >
          {isDarkMode ? (
            <Moon className="h-3 w-3 fill-slate-800" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
          isDarkMode
            ? 'bg-slate-800/90 border-slate-700/80 text-slate-200 hover:bg-slate-700/90 hover:text-white shadow-sm'
            : 'bg-emerald-50 border-teal-200/80 text-teal-900 hover:bg-emerald-100 hover:border-teal-300 shadow-sm'
        } ${className}`}
        title={isDarkMode ? 'Nhấn để chuyển sang Light Mode Teal/Mint' : 'Nhấn để chuyển sang Dark Mode'}
      >
        <div
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-950 border border-slate-700' : 'bg-[#008a73]'
          }`}
        >
          <span
            className={`pointer-events-none flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
              isDarkMode ? 'translate-x-0' : 'translate-x-4'
            }`}
          >
            {isDarkMode ? (
              <Moon className="h-2.5 w-2.5 text-slate-800" />
            ) : (
              <Sun className="h-2.5 w-2.5 text-amber-500" />
            )}
          </span>
        </div>
        <span>{isDarkMode ? 'Dark Mode: BẬT' : 'Light Mode: TEAL'}</span>
      </button>
    );
  }

  // Default: compact pill button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white shadow-sm'
          : 'bg-white border-teal-200/90 text-teal-800 hover:bg-teal-50 hover:border-teal-300 shadow-sm shadow-teal-900/5'
      } ${className}`}
      title={isDarkMode ? 'Chuyển sang giao diện Sáng Teal/Mint' : 'Chuyển sang giao diện Tối Dark Mode'}
    >
      <div className="flex items-center gap-1.5">
        {isDarkMode ? (
          <>
            <Moon className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="hidden sm:inline">Chế độ Tối</span>
          </>
        ) : (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-600 transition-colors" />
            <span className="hidden sm:inline font-bold text-teal-900">Sáng Teal/Mint</span>
          </>
        )}
      </div>
      {/* Mini switch indicator */}
      <span
        className={`ml-1 inline-block h-2 w-2 rounded-full transition-colors ${
          isDarkMode ? 'bg-blue-500' : 'bg-[#008a73]'
        }`}
      />
    </button>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { StudioTheme } from '../types';
import { THEME_CONFIGS, ThemeInfo } from '../services/themeService';
import { 
  Sparkles, 
  Compass, 
  Pencil, 
  Check, 
  ChevronDown, 
  Palette,
  Layers,
  SunMedium
} from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: StudioTheme;
  onThemeChange: (theme: StudioTheme) => void;
  className?: string;
  variant?: 'compact' | 'expanded' | 'button-group';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className = '',
  variant = 'compact'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentConfig = THEME_CONFIGS[currentTheme] || THEME_CONFIGS.architect;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getThemeIcon = (themeId: StudioTheme, sizeClass = 'w-3.5 h-3.5') => {
    switch (themeId) {
      case 'blueprint':
        return <Compass className={`${sizeClass} text-cyan-400`} />;
      case 'draft':
        return <Pencil className={`${sizeClass} text-zinc-300`} />;
      case 'architect':
      default:
        return <Sparkles className={`${sizeClass} text-violet-400`} />;
    }
  };

  if (variant === 'button-group') {
    return (
      <div className={`inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 ${className}`}>
        {(Object.keys(THEME_CONFIGS) as StudioTheme[]).map((themeKey) => {
          const cfg = THEME_CONFIGS[themeKey];
          const isSelected = currentTheme === themeKey;
          return (
            <button
              key={themeKey}
              onClick={() => onThemeChange(themeKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                isSelected
                  ? themeKey === 'blueprint'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm font-bold'
                    : themeKey === 'draft'
                    ? 'bg-zinc-700/60 text-zinc-100 border border-zinc-500/40 shadow-sm font-bold'
                    : 'bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={cfg.tagline}
              id={`theme-btn-group-${themeKey}`}
            >
              {getThemeIcon(themeKey, 'w-3.5 h-3.5')}
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 shadow-sm group ${
          currentTheme === 'blueprint'
            ? 'bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/40 text-cyan-200 hover:border-cyan-400 shadow-cyan-950/40'
            : currentTheme === 'draft'
            ? 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-600/50 text-zinc-200 hover:border-zinc-400'
            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200 hover:border-violet-500/40'
        }`}
        title={`Current Studio Theme: ${currentConfig.name} (${currentConfig.tagline}). Click to switch theme.`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        id="studio-theme-selector-trigger"
      >
        {/* Dynamic Theme Icon with animated glow */}
        <div className="flex items-center justify-center">
          {getThemeIcon(currentTheme, 'w-3.5 h-3.5 group-hover:scale-110 transition-transform')}
        </div>

        {/* Theme Name & Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline text-[11px] text-slate-400 font-sans">Theme:</span>
          <span className="font-semibold">{currentConfig.name}</span>
        </div>

        {/* Visual Miniature Swatch */}
        <div className="hidden lg:flex items-center gap-0.5 pl-1">
          <span 
            className="w-2 h-2 rounded-full border border-white/20 shadow-xs" 
            style={{ backgroundColor: currentConfig.preview.bg }} 
          />
          <span 
            className="w-2 h-2 rounded-full border border-white/20 shadow-xs" 
            style={{ backgroundColor: currentConfig.preview.accent }} 
          />
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Theme Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl glass-panel border border-white/15 p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-orientation="vertical"
          id="studio-theme-dropdown-menu"
        >
          {/* Header Banner */}
          <div className="px-2 py-1.5 mb-1.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
              <Palette className="w-3.5 h-3.5 text-violet-400" />
              <span>Studio Visual Themes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              3 Modes
            </span>
          </div>

          {/* Theme Option Cards */}
          <div className="space-y-1.5">
            {(Object.keys(THEME_CONFIGS) as StudioTheme[]).map((themeKey) => {
              const cfg = THEME_CONFIGS[themeKey];
              const isSelected = currentTheme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    onThemeChange(themeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start justify-between gap-3 border ${
                    isSelected
                      ? themeKey === 'blueprint'
                        ? 'bg-cyan-950/60 border-cyan-400/60 shadow-lg shadow-cyan-950/60'
                        : themeKey === 'draft'
                        ? 'bg-zinc-800/80 border-zinc-400/60 shadow-lg shadow-zinc-950/60'
                        : 'bg-violet-950/60 border-violet-500/60 shadow-lg shadow-violet-950/60'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                  }`}
                  role="menuitem"
                  id={`theme-option-${themeKey}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-2 rounded-lg border ${
                      themeKey === 'blueprint'
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : themeKey === 'draft'
                        ? 'bg-zinc-800 border-zinc-600'
                        : 'bg-violet-500/10 border-violet-500/30'
                    }`}>
                      {getThemeIcon(themeKey, 'w-4 h-4')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{cfg.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                          {cfg.tagline}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {cfg.description}
                      </p>

                      {/* Swatch Palette */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center -space-x-1">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                            style={{ backgroundColor: cfg.preview.bg }} 
                            title="Canvas Background"
                          />
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                            style={{ backgroundColor: cfg.preview.panel }} 
                            title="Surface Panel"
                          />
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                            style={{ backgroundColor: cfg.preview.accent }} 
                            title="Primary Accent"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {themeKey === 'architect' ? 'Dark • Violet' : themeKey === 'blueprint' ? 'Navy • Cyan' : 'Charcoal • Mono'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Radio / Check Indicator */}
                  <div className="mt-1">
                    {isSelected ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-xs ${
                        themeKey === 'blueprint'
                          ? 'bg-cyan-500 border-cyan-300 text-slate-950'
                          : themeKey === 'draft'
                          ? 'bg-white border-zinc-300 text-zinc-950'
                          : 'bg-violet-600 border-violet-400 text-white'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-2 pt-2 border-t border-white/10 px-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Theme auto-persists in workspace</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px]">ESC</kbd>
          </div>
        </div>
      )}
    </div>
  );
};

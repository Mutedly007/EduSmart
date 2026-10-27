import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Check,
  Type,
  Sun,
  Moon,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Language, FontSize } from '../../i18n/types';

export const LanguageSelector: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
  } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string; nativeName: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳', nativeName: 'العربية' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t.accessibility.switchLang}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-edu-500"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="font-semibold">{currentLang.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute end-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Section: Languages */}
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-edu-600" />
            <span>{t.accessibility.language}</span>
          </div>

          <div className="px-1.5 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-edu-50 text-edu-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({lang.label})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-edu-700" />}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-slate-100" />

          {/* Section: Accessibility Ergonomics */}
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-amber-600" />
            <span>{t.accessibility.title}</span>
          </div>

          {/* Text Size Controls */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-slate-500" />
                {t.accessibility.textSize}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {fontSize === 'normal' ? '100%' : fontSize === 'large' ? '110%' : '120%'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {(['normal', 'large', 'xlarge'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`py-1 text-xs rounded font-semibold transition-all ${
                    fontSize === size
                      ? 'bg-white text-edu-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {highContrast ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  {t.accessibility.highContrast}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={highContrast}
              onClick={() => setHighContrast(!highContrast)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                highContrast ? 'bg-edu-700 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-2xs block" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

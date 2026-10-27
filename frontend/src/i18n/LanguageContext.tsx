import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language, FontSize, TranslationSchema } from './types';
import { fr } from './translations/fr';
import { en } from './translations/en';
import { ar } from './translations/ar';

const translations: Record<Language, TranslationSchema> = {
  fr,
  en,
  ar,
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  t: TranslationSchema;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language state
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('edusmart_lang') as Language;
    return saved === 'en' || saved === 'ar' || saved === 'fr' ? saved : 'fr';
  });

  // 2. Font size state
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('edusmart_fontsize') as FontSize;
    return saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  });

  // 3. High contrast state
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('edusmart_highcontrast') === 'true';
  });

  const isRtl = language === 'ar';

  // Apply language, RTL direction and lang attribute to document
  useEffect(() => {
    localStorage.setItem('edusmart_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  // Apply font size class to document
  useEffect(() => {
    localStorage.setItem('edusmart_fontsize', fontSize);
    document.documentElement.classList.remove('font-large', 'font-xlarge');
    if (fontSize === 'large') {
      document.documentElement.classList.add('font-large');
    } else if (fontSize === 'xlarge') {
      document.documentElement.classList.add('font-xlarge');
    }
  }, [fontSize]);

  // Apply high contrast class to document
  useEffect(() => {
    localStorage.setItem('edusmart_highcontrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  const setHighContrast = (contrast: boolean) => {
    setHighContrastState(contrast);
  };

  const t = translations[language] || translations.fr;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isRtl,
        t,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Convenient alias
export const useTranslation = () => {
  const { t, language, isRtl } = useLanguage();
  return { t, language, isRtl };
};

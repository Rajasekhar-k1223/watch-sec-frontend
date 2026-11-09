import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { 
    SUPPORTED_COUNTRIES, 
    TRANSLATIONS, 
    detectBrowserCountryLanguage 
} from '../i18n/translations';
import type { CountryLanguageOption, TranslationKey } from '../i18n/translations';

interface I18nContextType {
    currentCountry: CountryLanguageOption;
    currentLanguageCode: string;
    setCountryLanguage: (countryCode: string) => void;
    t: (key: TranslationKey, fallback?: string) => string;
    isRTL: boolean;
    supportedCountries: CountryLanguageOption[];
}

const STORAGE_COUNTRY_KEY = 'monitorix_country_code';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentCountry, setCurrentCountry] = useState<CountryLanguageOption>(() => {
        const savedCode = localStorage.getItem(STORAGE_COUNTRY_KEY);
        if (savedCode) {
            const found = SUPPORTED_COUNTRIES.find(c => c.countryCode === savedCode);
            if (found) return found;
        }
        const detected = detectBrowserCountryLanguage();
        const found = SUPPORTED_COUNTRIES.find(c => c.countryCode === detected.countryCode);
        return found || SUPPORTED_COUNTRIES[0];
    });

    // Update document attributes (lang, dir for RTL like Arabic)
    useEffect(() => {
        document.documentElement.lang = currentCountry.languageCode;
        document.documentElement.dir = currentCountry.direction;
        if (currentCountry.direction === 'rtl') {
            document.body.classList.add('rtl-layout');
        } else {
            document.body.classList.remove('rtl-layout');
        }
    }, [currentCountry]);

    const setCountryLanguage = useCallback((countryCode: string) => {
        const selected = SUPPORTED_COUNTRIES.find(c => c.countryCode === countryCode);
        if (selected) {
            setCurrentCountry(selected);
            localStorage.setItem(STORAGE_COUNTRY_KEY, selected.countryCode);

            // Apply Google Translate cookie & event for complete DOM language conversion
            const gCode = selected.googleCode || 'en';
            const host = window.location.hostname;
            if (gCode === 'en') {
                document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                document.cookie = `googtrans=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
                document.cookie = `googtrans=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
            } else {
                document.cookie = `googtrans=/en/${gCode}; path=/;`;
                document.cookie = `googtrans=/en/${gCode}; path=/; domain=${host};`;
                document.cookie = `googtrans=/en/${gCode}; path=/; domain=.${host};`;
            }

            // Trigger Google Translate combo immediately if available in DOM
            const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
            if (combo) {
                combo.value = gCode;
                combo.dispatchEvent(new Event('change'));
            } else {
                // Reload cleanly so the Google Translate engine reads the new cookie
                setTimeout(() => {
                    window.location.reload();
                }, 80);
            }
        }
    }, []);

    const t = useCallback((key: TranslationKey, fallback?: string): string => {
        const langCode = currentCountry.languageCode;
        const dict = TRANSLATIONS[langCode] || TRANSLATIONS['en-US'];
        if (dict && dict[key]) {
            return dict[key];
        }
        // Fallback to English dictionary
        if (TRANSLATIONS['en-US'] && TRANSLATIONS['en-US'][key]) {
            return TRANSLATIONS['en-US'][key];
        }
        return fallback || key;
    }, [currentCountry]);

    return (
        <I18nContext.Provider
            value={{
                currentCountry,
                currentLanguageCode: currentCountry.languageCode,
                setCountryLanguage,
                t,
                isRTL: currentCountry.direction === 'rtl',
                supportedCountries: SUPPORTED_COUNTRIES,
            }}
        >
            {children}
        </I18nContext.Provider>
    );
};

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

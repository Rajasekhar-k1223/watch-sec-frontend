import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface LanguageSelectorProps {
    compact?: boolean;
    className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false, className = '' }) => {
    const { currentCountry, setCountryLanguage, supportedCountries } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    const filteredCountries = supportedCountries.filter(c => 
        c.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.languageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.regulatoryScope.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-haspopup="true"
                aria-expanded={isOpen}
                title={`Language: ${currentCountry.languageName} (${currentCountry.nativeName})`}
            >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-base leading-none">{currentCountry.flag}</span>
                <span className="font-bold text-slate-800">{currentCountry.languageName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                >
                    <div className="px-3 pb-2 border-b border-slate-100">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            <span>Select Language / भाषा चुनें</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search language (e.g. Hindi, Spanish)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto px-1 py-1 divide-y divide-slate-50">
                        {filteredCountries.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-slate-400">
                                No matching language found
                            </div>
                        ) : (
                            filteredCountries.map((c) => {
                                const isSelected = c.countryCode === currentCountry.countryCode;
                                return (
                                    <button
                                        key={c.countryCode}
                                        onClick={() => {
                                            setCountryLanguage(c.countryCode);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-2 text-left rounded-lg transition-colors ${
                                            isSelected 
                                                ? 'bg-blue-50/80 text-blue-900 font-semibold' 
                                                : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xl flex-shrink-0">{c.flag}</span>
                                            <div className="min-w-0">
                                                <div className="text-xs truncate flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-800">{c.languageName}</span>
                                                    <span className="text-[11px] text-slate-500">({c.nativeName})</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate">
                                                    {c.countryName}
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="px-3 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>⚡ Instant Language Conversion</span>
                        <span>Multi-Country Support</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;


'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, getStoredLanguage, setStoredLanguage, translations, t as translate, DEFAULT_LANGUAGE } from '@/lib/i18n';

export function useLanguage() {
    const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);

    useEffect(() => {
        // Load from localStorage on mount
        setLangState(getStoredLanguage());

        // Listen for changes from other components
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent<Language>;
            setLangState(customEvent.detail);
        };
        window.addEventListener('languagechange', handler);
        return () => window.removeEventListener('languagechange', handler);
    }, []);

    const setLanguage = useCallback((newLang: Language) => {
        setLangState(newLang);
        setStoredLanguage(newLang);
    }, []);

    const t = useCallback(
        (section: keyof typeof translations, key: string): string => {
            return translate(section, key, lang);
        },
        [lang]
    );

    return { lang, setLanguage, t };
}

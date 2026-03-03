'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CompanyInfo } from '@/app/api/ai/company-lookup/route';

interface CompanyAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (company: CompanyInfo) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    id?: string;
}

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function CompanyAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Nhập tên công ty...',
    required,
    className = '',
    id,
}: CompanyAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<CompanyInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIdx, setHighlightedIdx] = useState(-1);
    const [cache] = useState<Map<string, CompanyInfo[]>>(new Map());
    const wrapperRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const debouncedValue = useDebounce(value, 600);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search khi value thay đổi (sau debounce)
    useEffect(() => {
        const query = debouncedValue.trim();
        if (query.length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        // Cache hit
        const cacheKey = query.toLowerCase();
        if (cache.has(cacheKey)) {
            setSuggestions(cache.get(cacheKey)!);
            setIsOpen(true);
            return;
        }

        // Cancel previous request
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setIsLoading(true);
        fetch('/api/ai/company-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            signal: abortRef.current.signal,
        })
            .then(res => res.json())
            .then(data => {
                const companies: CompanyInfo[] = data.companies || [];
                setSuggestions(companies);
                cache.set(cacheKey, companies);
                setIsOpen(companies.length > 0);
                setHighlightedIdx(-1);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('[CompanyAutocomplete]', err);
                }
            })
            .finally(() => setIsLoading(false));
    }, [debouncedValue, cache]);

    const handleSelect = useCallback((company: CompanyInfo) => {
        onChange(company.name);
        onSelect(company);
        setIsOpen(false);
        setSuggestions([]);
    }, [onChange, onSelect]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' && highlightedIdx >= 0) {
            e.preventDefault();
            handleSelect(suggestions[highlightedIdx]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const confidenceColor = (c: number) => {
        if (c >= 0.85) return 'text-emerald-600';
        if (c >= 0.65) return 'text-amber-600';
        return 'text-gray-400';
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    required={required}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${className}`}
                />
                {/* Loading spinner / AI icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isLoading ? (
                        <svg className="animate-spin w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                        </svg>
                    ) : value.length >= 3 ? (
                        <span className="text-xs text-indigo-400 font-semibold">AI</span>
                    ) : null}
                </div>
            </div>

            {/* Dropdown suggestions */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-indigo-600">✨ AI tìm thấy {suggestions.length} công ty</span>
                        <span className="text-xs text-indigo-400">— Chọn để điền tự động</span>
                    </div>
                    {suggestions.map((company, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(company); }}
                            onMouseEnter={() => setHighlightedIdx(idx)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                                highlightedIdx === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-gray-900 truncate">{company.name}</div>
                                    {company.shortName && company.shortName !== company.name && (
                                        <div className="text-xs text-gray-500">{company.shortName}</div>
                                    )}
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                        {company.taxCode && (
                                            <span className="text-xs text-gray-600">
                                                🏷️ MST: <span className="font-mono font-bold">{company.taxCode}</span>
                                            </span>
                                        )}
                                        {company.province && (
                                            <span className="text-xs text-gray-500">📍 {company.province}</span>
                                        )}
                                    </div>
                                    {company.address && (
                                        <div className="text-xs text-gray-400 mt-0.5 truncate">{company.address}</div>
                                    )}
                                </div>
                                <span className={`text-xs flex-shrink-0 ${confidenceColor(company.confidence)}`}>
                                    {Math.round(company.confidence * 100)}%
                                </span>
                            </div>
                        </button>
                    ))}
                    <button
                        type="button"
                        onMouseDown={() => setIsOpen(false)}
                        className="w-full px-4 py-2 text-xs text-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        ✕ Nhập thủ công
                    </button>
                </div>
            )}

            {/* Không tìm thấy kết quả */}
            {isOpen && !isLoading && suggestions.length === 0 && value.trim().length >= 3 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-center text-xs text-gray-400">
                    Không tìm thấy công ty nào. Bạn có thể nhập thủ công.
                </div>
            )}
        </div>
    );
}

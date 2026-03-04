'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCached, setCached } from '@/lib/cache/localStorageCache';

// Types
export type Customer = {
    id: string;
    name: string;
    address?: string;
    taxCode?: string;
    email?: string;
    phone?: string;
};

export type Project = {
    id: string;
    projectNo: string;
    name: string;
    description?: string | null;
    notes?: string | null;
    location?: string | null;
    customerId: string | null;
    totalArea: number | null;
};

export type OutsourcingStaff = {
    id: string;
    name: string;
    discipline?: string;
    hourlyRate?: number;
    dailyRate?: number;
    isActive: boolean;
};

export type CatalogItem = {
    id: string;
    category: 'SCOPE' | 'DELIVERABLES' | 'PRICING';
    title: string;
    unit?: string;
    defaultPrice?: number;
    description?: string;
    group?: string;
    order: number;
};

// Context Value Interface
export interface QuotationDataContextValue {
    // Data
    customers: Customer[];
    projects: Project[];
    outsourceStaff: OutsourcingStaff[];
    catalog: CatalogItem[];
    
    // Loading states
    isLoadingCustomers: boolean;
    isLoadingProjects: boolean;
    isLoadingOutsourceStaff: boolean;
    isLoadingCatalog: boolean;
    isLoading: boolean; // Overall loading
    
    // Error
    error: string | null;
    
    // Actions
    refresh: () => Promise<void>;
    refreshCustomers: () => Promise<void>;
    refreshProjects: () => Promise<void>;
    refreshOutsourceStaff: () => Promise<void>;
    refreshCatalog: () => Promise<void>;
}

// Create Context
const QuotationDataContext = createContext<QuotationDataContextValue | undefined>(undefined);

// Provider Component
export function QuotationDataProvider({ children }: { children: React.ReactNode }) {
    // Data states
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [outsourceStaff, setOutsourceStaff] = useState<OutsourcingStaff[]>([]);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    
    // Loading states
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isLoadingOutsourceStaff, setIsLoadingOutsourceStaff] = useState(true);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    
    // Error state
    const [error, setError] = useState<string | null>(null);
    
    // Overall loading (true if any data is loading)
    const isLoading = isLoadingCustomers || isLoadingProjects || isLoadingOutsourceStaff || isLoadingCatalog;
    
    // Cache keys and TTL
    const CACHE_KEYS = {
        customers: 'quotation-data-customers',
        projects: 'quotation-data-projects',
        outsourceStaff: 'quotation-data-outsource-staff',
        catalog: 'quotation-data-catalog',
    };
    
    const TTL = {
        customers: 5 * 60 * 1000, // 5 minutes
        projects: 5 * 60 * 1000, // 5 minutes
        outsourceStaff: 10 * 60 * 1000, // 10 minutes
        catalog: 10 * 60 * 1000, // 10 minutes
    };
    
    // Fetch functions
    const fetchCustomers = useCallback(async () => {
        setIsLoadingCustomers(true);
        setError(null);
        try {
            const res = await fetch('/api/customers');
            const result = await res.json();
            if (result.success) {
                setCustomers(result.data);
            } else {
                setError(result.error || 'Failed to fetch customers');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch customers';
            setError(message);
            console.error('Failed to fetch customers:', err);
        } finally {
            setIsLoadingCustomers(false);
        }
    }, []);
    
    const fetchProjects = useCallback(async () => {
        setIsLoadingProjects(true);
        setError(null);
        try {
            const res = await fetch('/api/projects?pageSize=200');
            const result = await res.json();
            if (result.success) {
                setProjects(result.data);
            } else {
                setError(result.error || 'Failed to fetch projects');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch projects';
            setError(message);
            console.error('Failed to fetch projects:', err);
        } finally {
            setIsLoadingProjects(false);
        }
    }, []);
    
    const fetchOutsourceStaff = useCallback(async () => {
        setIsLoadingOutsourceStaff(true);
        setError(null);
        try {
            // Lấy danh sách user ACTIVE thay vì OutsourcingStaff
            const res = await fetch('/api/users?status=ACTIVE');
            const result = await res.json();
            if (result.success) {
                // Map user fields sang OutsourcingStaff interface
                const mapped: OutsourcingStaff[] = (result.data || []).map((u: any) => ({
                    id: u.id,
                    name: u.name || u.email,
                    discipline: u.department || undefined,
                    isActive: true,
                }));
                setOutsourceStaff(mapped);
            } else {
                setError(result.error || 'Failed to fetch users for outsource staff');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch users for outsource staff';
            setError(message);
            console.error('Failed to fetch users for outsource staff:', err);
        } finally {
            setIsLoadingOutsourceStaff(false);
        }
    }, []);
    
    const fetchCatalog = useCallback(async () => {
        setIsLoadingCatalog(true);
        setError(null);
        try {
            const res = await fetch('/api/catalog');
            const result = await res.json();
            if (result.success) {
                setCatalog(result.data);
                // Save to cache
                setCached(CACHE_KEYS.catalog, result.data, TTL.catalog);
            } else {
                setError(result.error || 'Failed to fetch catalog');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch catalog';
            setError(message);
            console.error('Failed to fetch catalog:', err);
        } finally {
            setIsLoadingCatalog(false);
        }
    }, []);
    
    // Fetch all initial data using batch endpoint with localStorage cache
    const fetchInitialData = useCallback(async () => {
        setError(null);
        
        // Try load from cache first
        const cachedCustomers = getCached<Customer[]>(CACHE_KEYS.customers, TTL.customers);
        const cachedProjects = getCached<Project[]>(CACHE_KEYS.projects, TTL.projects);
        const cachedOutsourceStaff = getCached<OutsourcingStaff[]>(CACHE_KEYS.outsourceStaff, TTL.outsourceStaff);
        const cachedCatalog = getCached<CatalogItem[]>(CACHE_KEYS.catalog, TTL.catalog);
        
        // If all cached data is available and valid, use it
        if (cachedCustomers && cachedProjects && cachedOutsourceStaff) {
            setCustomers(cachedCustomers);
            setProjects(cachedProjects);
            setOutsourceStaff(cachedOutsourceStaff);
            setIsLoadingCustomers(false);
            setIsLoadingProjects(false);
            setIsLoadingOutsourceStaff(false);
            
            // Fetch in background to update cache (stale-while-revalidate pattern)
            fetch('/api/quotation/initial-data')
                .then((res) => res.json())
                .then((result) => {
                    if (result.success) {
                        setCustomers(result.data.customers || []);
                        setProjects(result.data.projects || []);
                        setOutsourceStaff(result.data.outsourceStaff || []);
                        
                        // Update cache
                        setCached(CACHE_KEYS.customers, result.data.customers || [], TTL.customers);
                        setCached(CACHE_KEYS.projects, result.data.projects || [], TTL.projects);
                        setCached(CACHE_KEYS.outsourceStaff, result.data.outsourceStaff || [], TTL.outsourceStaff);
                    }
                })
                .catch((err) => {
                    console.error('Background fetch failed:', err);
                    // Ignore background fetch errors
                });
        } else {
            // No valid cache, fetch from API
            setIsLoadingCustomers(true);
            setIsLoadingProjects(true);
            setIsLoadingOutsourceStaff(true);
            
            try {
                // Use batch endpoint to fetch all data in one request
                const res = await fetch('/api/quotation/initial-data');
                const result = await res.json();
                
                if (result.success) {
                    // Set all data from batch response
                    setCustomers(result.data.customers || []);
                    setProjects(result.data.projects || []);
                    setOutsourceStaff(result.data.outsourceStaff || []);
                    
                    // Save to cache
                    setCached(CACHE_KEYS.customers, result.data.customers || [], TTL.customers);
                    setCached(CACHE_KEYS.projects, result.data.projects || [], TTL.projects);
                    setCached(CACHE_KEYS.outsourceStaff, result.data.outsourceStaff || [], TTL.outsourceStaff);
                } else {
                    setError(result.error || 'Failed to fetch initial data');
                    // Fallback to individual fetches if batch fails
                    await Promise.all([
                        fetchCustomers(),
                        fetchProjects(),
                        fetchOutsourceStaff(),
                    ]);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to fetch initial data';
                setError(message);
                console.error('Failed to fetch initial data:', err);
                // Fallback to individual fetches
                await Promise.all([
                    fetchCustomers(),
                    fetchProjects(),
                    fetchOutsourceStaff(),
                ]);
            } finally {
                setIsLoadingCustomers(false);
                setIsLoadingProjects(false);
                setIsLoadingOutsourceStaff(false);
            }
        }
        
        // Handle catalog separately
        if (cachedCatalog) {
            setCatalog(cachedCatalog);
            setIsLoadingCatalog(false);
            
            // Background update
            fetchCatalog().catch((err) => {
                console.error('Background catalog fetch failed:', err);
            });
        } else {
            await fetchCatalog();
        }
    }, [fetchCustomers, fetchProjects, fetchOutsourceStaff, fetchCatalog]);
    
    // Fetch initial data on mount
    useEffect(() => {
        void fetchInitialData();
    }, [fetchInitialData]);
    
    // Context value
    const value: QuotationDataContextValue = {
        customers,
        projects,
        outsourceStaff,
        catalog,
        isLoadingCustomers,
        isLoadingProjects,
        isLoadingOutsourceStaff,
        isLoadingCatalog,
        isLoading,
        error,
        refresh: fetchInitialData,
        refreshCustomers: fetchCustomers,
        refreshProjects: fetchProjects,
        refreshOutsourceStaff: fetchOutsourceStaff,
        refreshCatalog: fetchCatalog,
    };
    
    return (
        <QuotationDataContext.Provider value={value}>
            {children}
        </QuotationDataContext.Provider>
    );
}

// Hook to use context
export function useQuotationData(): QuotationDataContextValue {
    const context = useContext(QuotationDataContext);
    if (context === undefined) {
        throw new Error('useQuotationData must be used within a QuotationDataProvider');
    }
    return context;
}

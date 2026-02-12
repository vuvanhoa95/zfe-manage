'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    rate?: number;
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
            const res = await fetch('/api/projects');
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
            const res = await fetch('/api/outsourcing-staff?isActive=true');
            const result = await res.json();
            if (result.success) {
                setOutsourceStaff(result.data);
            } else {
                setError(result.error || 'Failed to fetch outsource staff');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch outsource staff';
            setError(message);
            console.error('Failed to fetch outsource staff:', err);
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
    
    // Fetch all initial data
    const fetchInitialData = useCallback(async () => {
        setError(null);
        // Fetch all in parallel
        await Promise.all([
            fetchCustomers(),
            fetchProjects(),
            fetchOutsourceStaff(),
            fetchCatalog(),
        ]);
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

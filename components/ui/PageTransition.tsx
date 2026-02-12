'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Phase = 'idle' | 'exiting' | 'entering';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
    enterMs?: number;
    exitMs?: number;
}

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

export function PageTransition({ children, className, enterMs = 200, exitMs = 120 }: PageTransitionProps) {
    const pathname = usePathname();
    const reducedMotion = prefersReducedMotion();

    const [current, setCurrent] = useState<React.ReactNode>(children);
    const [next, setNext] = useState<React.ReactNode | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [currentPath, setCurrentPath] = useState<string>(pathname);

    const exitTimerRef = useRef<number | null>(null);
    const enterTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
            if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (pathname === currentPath) {
            // Same route; keep latest children.
            setCurrent(children);
            return;
        }

        if (reducedMotion) {
            setCurrent(children);
            setNext(null);
            setPhase('idle');
            setCurrentPath(pathname);
            return;
        }

        if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
        if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);

        setNext(children);
        setPhase('exiting');

        exitTimerRef.current = window.setTimeout(() => {
            setCurrent(children);
            setNext(null);
            setPhase('entering');
            setCurrentPath(pathname);

            enterTimerRef.current = window.setTimeout(() => {
                setPhase('idle');
            }, enterMs);
        }, exitMs);
    }, [children, currentPath, enterMs, exitMs, pathname, reducedMotion]);

    const phaseClass = phase === 'exiting' ? 'zf-page-exit' : phase === 'entering' ? 'zf-page-enter' : '';

    return <div className={['zf-page', phaseClass, className].filter(Boolean).join(' ')}>{current}</div>;
}


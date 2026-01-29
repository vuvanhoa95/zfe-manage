'use client';

import React, { useEffect, useRef, useState } from 'react';

type Key = string | number;

type Phase = 'idle' | 'exiting' | 'entering';

type Variant = 'fade' | 'ios';
type MotionDir = 'forward' | 'backward';

interface AnimatedTabPanelsProps<K extends Key> {
    activeKey: K;
    render: (key: K) => React.ReactNode;
    className?: string;
    enterMs?: number;
    exitMs?: number;
    variant?: Variant;
    orderedKeys?: readonly K[];
}

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

// Hiện tại UX yêu cầu bỏ hiệu ứng chuyển tab => luôn chuyển tức thì.
const DISABLE_TAB_ANIMATION = true;

export function AnimatedTabPanels<K extends Key>({
    activeKey,
    render,
    className,
    enterMs = 260,
    exitMs = 180,
    variant = 'fade',
    orderedKeys,
}: AnimatedTabPanelsProps<K>) {
    const reducedMotion = prefersReducedMotion();

    const [currentKey, setCurrentKey] = useState<K>(activeKey);
    const [nextKey, setNextKey] = useState<K | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [motionDir, setMotionDir] = useState<MotionDir>('forward');

    const exitTimerRef = useRef<number | null>(null);
    const enterTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
            if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (activeKey === currentKey && nextKey === null) return;

        // Bỏ hiệu ứng chuyển tab: cập nhật trực tiếp, không delay, không animation.
        if (DISABLE_TAB_ANIMATION) {
            setCurrentKey(activeKey);
            setNextKey(null);
            setPhase('idle');
            return;
        }

        if (reducedMotion) {
            setCurrentKey(activeKey);
            setNextKey(null);
            setPhase('idle');
            return;
        }

        // Always start/continue an exit when requested key changes.
        if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
        if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);

        // Determine direction (used by iOS-style horizontal slide).
        if (orderedKeys && orderedKeys.length > 0) {
            const fromIndex = orderedKeys.indexOf(currentKey);
            const toIndex = orderedKeys.indexOf(activeKey);
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                setMotionDir(toIndex > fromIndex ? 'forward' : 'backward');
            }
        }

        setNextKey(activeKey);
        setPhase('exiting');

        exitTimerRef.current = window.setTimeout(() => {
            setCurrentKey(activeKey);
            setNextKey(null);
            setPhase('entering');

            enterTimerRef.current = window.setTimeout(() => {
                setPhase('idle');
            }, enterMs);
        }, exitMs);
    }, [activeKey, currentKey, enterMs, exitMs, nextKey, orderedKeys, reducedMotion]);

    const phaseClass = phase === 'exiting' ? 'zf-tabpanel-exit' : phase === 'entering' ? 'zf-tabpanel-enter' : '';
    const variantClass = variant === 'ios' ? 'zf-tabpanel-variant-ios' : 'zf-tabpanel-variant-fade';
    const dirClass = motionDir === 'backward' ? 'zf-tabpanel-dir-backward' : 'zf-tabpanel-dir-forward';

    const style = reducedMotion
        ? undefined
        : ({
              // Keep CSS animation durations in sync with the JS timers.
              ['--zf-tab-enter-ms' as any]: `${enterMs}ms`,
              ['--zf-tab-exit-ms' as any]: `${exitMs}ms`,
          } satisfies React.CSSProperties);

    return (
        <div
            className={['zf-tabpanel', variantClass, dirClass, phaseClass, className].filter(Boolean).join(' ')}
            style={style}
        >
            {render(currentKey)}
        </div>
    );
}


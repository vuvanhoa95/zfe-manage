'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
  category?: string;
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const defaultCommands: Command[] = [
    {
      id: 'new-quotation',
      label: 'Tạo Báo giá mới',
      shortcut: 'Ctrl+N',
      icon: '➕',
      category: 'Báo giá',
      action: () => router.push('/quotations/new'),
    },
    {
      id: 'new-customer',
      label: 'Thêm Khách hàng mới',
      shortcut: 'Ctrl+C',
      icon: '👥',
      category: 'Khách hàng',
      action: () => router.push('/customers/new'),
    },
    {
      id: 'quotations',
      label: 'Xem tất cả Báo giá',
      shortcut: 'Ctrl+Q',
      icon: '📄',
      category: 'Báo giá',
      action: () => router.push('/quotations'),
    },
    {
      id: 'projects',
      label: 'Xem tất cả Dự án',
      shortcut: 'Ctrl+P',
      icon: '📊',
      category: 'Dự án',
      action: () => router.push('/projects'),
    },
    {
      id: 'dashboard',
      label: 'Về Dashboard',
      shortcut: 'Ctrl+D',
      icon: '🏠',
      category: 'Navigation',
      action: () => router.push('/'),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    commands: defaultCommands,
  };
}

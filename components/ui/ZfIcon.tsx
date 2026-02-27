import type { SVGProps } from 'react';

export type ZfIconName =
    | 'dashboard'
    | 'projects'
    | 'quotations'
    | 'customers'
    | 'outsourcingStaff'
    | 'companyProfile'
    | 'settings'
    | 'search'
    | 'notification'
    | 'user'
    | 'staff';

export interface ZfIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
    name: ZfIconName;
    size?: number;
}

/**
 * ZFENIX Icon component
 *
 * Ghi chú:
 * - Icon được vẽ dạng SVG đơn sắc, sử dụng currentColor để kế thừa màu chữ.
 * - Có thể thay thế path bằng SVG lấy từ SVG Awesome: https://svgawesome.com/
 * - Mục tiêu: đồng bộ style icon, tránh emoji nhiều màu.
 */
export default function ZfIcon({ name, size = 20, className, ...rest }: ZfIconProps) {
    const commonProps = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        className,
        ...rest,
    };

    switch (name) {
        case 'dashboard':
            return (
                <svg {...commonProps}>
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="14" y="11" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="3" y="13" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
            );
        case 'projects':
            return (
                <svg {...commonProps}>
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 3l2 2h4l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'quotations':
            return (
                <svg {...commonProps}>
                    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M8 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'customers':
            return (
                <svg {...commonProps}>
                    <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
                    <path
                        d="M4.5 18.5C5.3 16.4 7.1 15 9 15c1.9 0 3.7 1.4 4.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <path
                        d="M14.5 17.5c.6-1.4 1.8-2.5 3.5-2.5 1.7 0 2.9 1.1 3.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'outsourcingStaff':
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.6" />
                    <path
                        d="M6.5 18.5C7.4 16.2 9.5 15 12 15c2.5 0 4.6 1.2 5.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path
                        d="M7 12l1-3.5 2-.5M17 12l-1-3.5-2-.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'companyProfile':
            return (
                <svg {...commonProps}>
                    <path
                        d="M5 19V6.5L12 3l7 3.5V19"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M10 19v-4h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'settings':
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                    <path
                        d="M5.5 12.5l-1.5-.5.8-2 1.5.5a5 5 0 0 1 1.6-1.6L8.5 7l2-.8.5 1.5a5 5 0 0 1 2.1 0L13.5 6l2 .8-.4 1.9a5 5 0 0 1 1.6 1.6l1.9-.4.8 2-1.5.5a5 5 0 0 1 0 2.1l1.5.5-.8 2-1.9-.4a5 5 0 0 1-1.6 1.6l.4 1.9-2 .8-.5-1.5a5 5 0 0 1-2.1 0L10.5 20l-2-.8.4-1.9a5 5 0 0 1-1.6-1.6l-1.9.4-.8-2 1.5-.5a5 5 0 0 1 0-2.1z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case 'search':
            return (
                <svg {...commonProps}>
                    <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M15 15l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'notification':
            return (
                <svg {...commonProps}>
                    <path
                        d="M7 10a5 5 0 0 1 10 0v3.2l1.3 2.6A1 1 0 0 1 17.4 17H6.6a1 1 0 0 1-.9-1.2L7 13.2V10z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case 'user':
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                    <path
                        d="M6.5 19c.8-2.1 2.8-3.5 5.5-3.5s4.7 1.4 5.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'staff':
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.6" />
                    <path
                        d="M7 19c.7-1.9 2.4-3.1 4.5-3.1 2.1 0 3.8 1.2 4.5 3.1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path
                        d="M7.5 12.5l.7-2.2 1.8-.4M16.5 12.5l-.7-2.2-1.8-.4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            );
        default:
            return (
                <svg {...commonProps}>
                    <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
            );
    }
}


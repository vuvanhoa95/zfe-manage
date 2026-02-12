interface ContentCardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export default function ContentCard({
    children,
    className = '',
    noPadding = false
}: ContentCardProps) {
    return (
        <div className={`card-premium ${noPadding ? '' : 'p-6'} ${className}`}>
            {children}
        </div>
    );
}

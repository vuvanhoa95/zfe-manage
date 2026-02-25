import Image from 'next/image';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: string;
    showLogo?: boolean;
    actions?: React.ReactNode;
}

export default function PageHeader({
    title,
    description,
    icon = '📄',
    showLogo = false,
    actions
}: PageHeaderProps) {
    return (
        <div className="glass-card rounded-2xl px-6 py-4 flex items-center justify-between gap-4 shadow-lg border border-white/40 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl mb-4">
            <div className="flex items-center gap-4">
                {showLogo ? (
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center overflow-hidden shadow-lg animate-pulse-glow">
                        <Image
                            src="/window.svg"
                            alt="ZFENIX Logo"
                            width={40}
                            height={40}
                            className="w-9 h-9 drop-shadow-md"
                        />
                    </div>
                ) : (
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center overflow-hidden shadow-lg">
                        <span className="text-3xl">{icon}</span>
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zf-primary via-zf-primary-light to-zf-accent bg-clip-text text-transparent">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

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
        <div className="glass-card rounded-3xl px-8 py-6 flex items-center justify-between gap-6 shadow-lg border border-white/40 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl mb-6">
            <div className="flex items-center gap-5">
                {showLogo ? (
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center overflow-hidden shadow-lg animate-pulse-glow">
                        <Image
                            src="/window.svg"
                            alt="ZFENIX Logo"
                            width={48}
                            height={48}
                            className="w-11 h-11 drop-shadow-md"
                        />
                    </div>
                ) : (
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center overflow-hidden shadow-lg">
                        <span className="text-4xl">{icon}</span>
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zf-primary via-zf-primary-light to-zf-accent bg-clip-text text-transparent">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-gray-600 mt-1.5 font-medium">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}

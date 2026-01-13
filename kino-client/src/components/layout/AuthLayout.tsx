import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-pink-50">
            
            {/* --- BACKGROUND MESH GRADIENTS (The "Alive" Part) --- */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                {/* Blob 1: Top Left - Soft Pink */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                
                {/* Blob 2: Top Right - Rose Accent */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                
                {/* Blob 3: Bottom Center - Purple/Pink mix */}
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
            </div>

            {/* --- GLASS CARD CONTENT --- */}
            <div className="relative z-10 w-full max-w-lg px-6">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600 mb-2">
                        kino.
                    </h1>
                    <p className="text-rose-900/60 font-medium tracking-widest text-xs uppercase">
                        {subtitle}
                    </p>
                </div>

                {/* The "Glass" Box */}
                <div className="glass-panel p-8 md:p-12 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">{title}</h2>
                    {children}
                </div>
            </div>
        </div>
    );
};
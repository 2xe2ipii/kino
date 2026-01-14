export const Loading = ({ fullScreen = false }: { fullScreen?: boolean }) => {
    const content = (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-rose-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-12 h-12 flex items-center justify-center bg-rose-500 rounded-full shadow-xl shadow-rose-200 animate-pulse">
                    <span className="text-white font-black text-xl tracking-tighter">k.</span>
                </div>
            </div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest animate-pulse">Loading</p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                {content}
            </div>
        );
    }

    return <div className="p-8 flex items-center justify-center">{content}</div>;
};
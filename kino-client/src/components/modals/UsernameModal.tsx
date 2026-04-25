import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

export const UsernameModal = () => {
    const { pendingGoogle, completeProfile } = useContext(AuthContext)!;
    const [username, setUsername] = useState('');
    
    // Pre-fill username once when pendingGoogle is set
    useEffect(() => {
        if (pendingGoogle && !username) {
            const suggested = pendingGoogle.displayName
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9_-]/g, '')
                .slice(0, 20);
            setUsername(suggested);
        }
    }, [pendingGoogle]);

    const [available, setAvailable] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isValidFormat = /^[a-zA-Z0-9_-]{3,20}$/.test(username);

    useEffect(() => {
        if (!isValidFormat) { setAvailable(null); return; }
        const timeout = setTimeout(async () => {
            setChecking(true);
            try {
                const res = await api.get(`/auth/check-username?username=${username}`);
                setAvailable(res.data.available);
            } catch {
                setAvailable(null);
            } finally {
                setChecking(false);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [username, isValidFormat]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!available || !isValidFormat || loading) return;
        setLoading(true);
        setError('');
        try {
            await completeProfile(username);
        } catch {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    if (!pendingGoogle) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center gap-6">

                <div className="text-center">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">One last thing.</h2>
                    <p className="text-slate-500 font-medium">
                        Welcome, <strong>{pendingGoogle.displayName}</strong>.<br />
                        Pick your Kino username.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="username"
                            value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                            className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400"
                            autoFocus
                        />
                        {username.length >= 3 && (
                            <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors ${
                                checking ? 'text-slate-400' : available ? 'text-green-500' : 'text-rose-500'
                            }`}>
                                {checking ? '…' : available ? '✓ available' : '✗ taken'}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-slate-400 font-medium text-center">
                        3–20 characters · letters, numbers, _ and -
                    </p>

                    {error && (
                        <p className="text-rose-500 text-sm font-bold text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={!available || !isValidFormat || loading}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Creating account…' : 'Get Started'}
                    </button>
                </form>
            </div>
        </div>
    );
};

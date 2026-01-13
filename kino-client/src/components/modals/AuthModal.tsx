import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

type ViewState = 'LOGIN' | 'REGISTER' | 'VERIFY';

export const AuthModal = () => {
    const { isModalOpen, closeModal, login } = useContext(AuthContext)!;
    const [view, setView] = useState<ViewState>('LOGIN');
    
    // Form Data
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(!isModalOpen) {
            setView('LOGIN');
            setError('');
            setCode('');
        }
    }, [isModalOpen]);

    if (!isModalOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            login(res.data.token);
        } catch (err: any) {
            setError('Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', { username, email, password });
            setUserId(res.data.userId); 
            setView('VERIFY');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-email', { userId, token: code });
            const loginRes = await api.post('/auth/login', { username, password });
            login(loginRes.data.token);
        } catch (err: any) {
            setError('Invalid code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">✕</button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {view === 'LOGIN' && 'Welcome Back'}
                        {view === 'REGISTER' && 'Join Kino'}
                        {view === 'VERIFY' && 'Check Email'}
                    </h2>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mt-1">
                        {view === 'VERIFY' ? `Sent to ${email}` : 'The Movie Diary'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-2 bg-red-50 text-red-500 text-xs text-center rounded-lg font-medium">
                        {error}
                    </div>
                )}

                {view === 'LOGIN' && (
                    <form onSubmit={handleLogin} className="space-y-3">
                        <input placeholder="Username" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none" value={username} onChange={e => setUsername(e.target.value)} />
                        <input type="password" placeholder="Password" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                        <button disabled={loading} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-200">{loading ? '...' : 'Sign In'}</button>
                        <p className="text-center text-xs text-slate-400 mt-4 cursor-pointer hover:text-rose-500" onClick={() => setView('REGISTER')}>New? Create account</p>
                    </form>
                )}

                {view === 'REGISTER' && (
                    <form onSubmit={handleRegister} className="space-y-3">
                        <input placeholder="Username" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none" value={username} onChange={e => setUsername(e.target.value)} />
                        <input type="email" placeholder="Email" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                        <input type="password" placeholder="Password" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                        <button disabled={loading} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-200">{loading ? '...' : 'Send Code'}</button>
                        <p className="text-center text-xs text-slate-400 mt-4 cursor-pointer hover:text-rose-500" onClick={() => setView('LOGIN')}>Have an account?</p>
                    </form>
                )}

                {view === 'VERIFY' && (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="flex justify-center">
                            <input placeholder="000000" className="w-2/3 text-center text-2xl tracking-widest font-mono bg-slate-50 border-none rounded-xl py-3 focus:ring-2 focus:ring-rose-200 outline-none text-slate-700" value={code} onChange={e => setCode(e.target.value)} />
                        </div>
                        <button disabled={loading} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-200">{loading ? 'Verifying...' : 'Confirm'}</button>
                        <p className="text-center text-xs text-slate-400 mt-4 cursor-pointer hover:text-rose-500" onClick={() => setView('REGISTER')}>Wrong email? Back</p>
                    </form>
                )}
            </div>
        </div>
    );
};
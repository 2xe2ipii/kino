import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Loading } from '../ui/Loading';

const STEP_LOGIN = 0;
const STEP_REGISTER = 1;
const STEP_VERIFY = 2;
const STEP_ONBOARD_PROFILE = 3;
const STEP_ONBOARD_AVATAR = 4;

export const AuthModal = () => {
    const { modalType, closeModal, login } = useContext(AuthContext)!;
    
    const [step, setStep] = useState(STEP_LOGIN);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form Data
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(''); 
    const [verificationCode, setVerificationCode] = useState('');
    
    // Onboarding Data
    const [displayName, setDisplayName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    if (!modalType) return null;
    if (step === STEP_LOGIN && modalType === 'REGISTER' && !loading && username === '') setStep(STEP_REGISTER);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            login(res.data.token, res.data.username, true); 
            setStep(STEP_LOGIN); 
        } catch (err: any) {
            setError(err.response?.data || 'Login failed');
        } finally { setLoading(false); }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/register', { username, email, password });
            setUserId(res.data.userId); 
            setStep(STEP_VERIFY);
        } catch (err: any) {
            setError(err.response?.data?.[0]?.description || 'Registration failed');
        } finally { setLoading(false); }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/verify-email', { userId, token: verificationCode });
            // Login but keep modal open for onboarding
            login(res.data.token, res.data.username, false);
            setStep(STEP_ONBOARD_PROFILE);
        } catch (err: any) {
            setError('Invalid code.');
        } finally { setLoading(false); }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/auth/profile', { displayName });
            setStep(STEP_ONBOARD_AVATAR);
        } catch (e) { setError('Failed to save name.'); }
        finally { setLoading(false); }
    };

    const handleAvatarUpload = async (skip: boolean) => {
        if (skip) {
            finishOnboarding();
            return;
        }
        if (!avatarFile) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', avatarFile);
            await api.post('/auth/upload-avatar', formData);
            finishOnboarding();
        } catch (e) { setError('Upload failed.'); }
        finally { setLoading(false); }
    };

    const finishOnboarding = () => {
        closeModal();
        window.location.reload(); // Refresh to show new avatar/name state
    };

    // Helper for Step Dots
    const renderDots = (current: number, total: number) => (
        <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= current ? 'w-8 bg-rose-500' : 'w-2 bg-slate-200'}`} />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
                
                <button onClick={closeModal} className="absolute top-6 right-6 text-slate-300 hover:text-slate-800 z-20 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {loading && <div className="absolute inset-0 bg-white/90 z-30 flex items-center justify-center"><Loading /></div>}

                <div className="flex-1 p-10 md:p-14 flex flex-col justify-center">

                    {/* --- 1. LOGIN --- */}
                    {step === STEP_LOGIN && (
                        <form onSubmit={handleLogin} className="space-y-6 max-w-sm mx-auto w-full">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Welcome back.</h2>
                                <p className="text-slate-500 font-medium">Sign in to your Kino diary.</p>
                            </div>

                            {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl text-xs font-bold text-center">{error}</div>}
                            
                            <div className="space-y-3">
                                <input type="text" placeholder="Username" className="w-full bg-slate-100 border-none p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400" value={username} onChange={e => setUsername(e.target.value)} />
                                <input type="password" placeholder="Password" className="w-full bg-slate-100 border-none p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform active:scale-95">
                                Login
                            </button>

                            <div className="text-center pt-4">
                                <span className="text-slate-400 font-bold text-sm">No account? </span>
                                <button type="button" onClick={() => setStep(STEP_REGISTER)} className="text-rose-500 font-black text-sm hover:underline">Join Club</button>
                            </div>
                        </form>
                    )}

                    {/* --- 2. REGISTER --- */}
                    {step === STEP_REGISTER && (
                        <form onSubmit={handleRegister} className="space-y-6 max-w-sm mx-auto w-full">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-rose-500 tracking-tighter mb-2">Join the Club.</h2>
                                <p className="text-slate-500 font-medium">Create your Kino account.</p>
                            </div>

                            {renderDots(0, 4)}

                            {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl text-xs font-bold text-center">{error}</div>}
                            
                            <div className="space-y-3">
                                <input type="text" placeholder="Username" className="w-full bg-slate-100 border-none p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400" value={username} onChange={e => setUsername(e.target.value)} />
                                <input type="email" placeholder="Email" className="w-full bg-slate-100 border-none p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400" value={email} onChange={e => setEmail(e.target.value)} />
                                <input type="password" placeholder="Password" className="w-full bg-slate-100 border-none p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>

                            <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-95">
                                Verify
                            </button>

                            <div className="text-center pt-4">
                                <span className="text-slate-400 font-bold text-sm">Have an account? </span>
                                <button type="button" onClick={() => setStep(STEP_LOGIN)} className="text-slate-800 font-black text-sm hover:underline">Login</button>
                            </div>
                        </form>
                    )}

                    {/* --- 3. VERIFY --- */}
                    {step === STEP_VERIFY && (
                        <form onSubmit={handleVerify} className="space-y-8 max-w-sm mx-auto w-full text-center">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Check your email.</h2>
                                <p className="text-slate-500 font-medium">We sent a code to <span className="text-slate-800 font-bold">{email}</span></p>
                            </div>

                            {renderDots(1, 4)}

                            {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl text-xs font-bold">{error}</div>}

                            <input 
                                type="text" 
                                placeholder="000000" 
                                className="w-full bg-slate-100 border-none p-6 rounded-2xl font-black text-3xl text-center text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 tracking-[1rem] placeholder:text-slate-300 transition-all" 
                                value={verificationCode} 
                                onChange={e => setVerificationCode(e.target.value)} 
                                autoFocus
                            />

                            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform active:scale-95">
                                Continue
                            </button>
                        </form>
                    )}

                    {/* --- 4. ONBOARDING: DISPLAY NAME --- */}
                    {step === STEP_ONBOARD_PROFILE && (
                        <form onSubmit={handleSaveProfile} className="space-y-8 max-w-sm mx-auto w-full text-center animate-in slide-in-from-right duration-500">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Who are you?</h2>
                                <p className="text-slate-500 font-medium">Your username is @{username}. Pick a name for your profile.</p>
                            </div>

                            {renderDots(2, 4)}

                            <input 
                                type="text" 
                                placeholder="Display Name (e.g. Marty McFly)" 
                                className="w-full bg-slate-100 border-none p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 text-center" 
                                value={displayName} 
                                onChange={e => setDisplayName(e.target.value)} 
                                autoFocus 
                            />

                            <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-95">
                                Next
                            </button>
                        </form>
                    )}

                    {/* --- 5. ONBOARDING: AVATAR --- */}
                    {step === STEP_ONBOARD_AVATAR && (
                        <div className="space-y-8 max-w-sm mx-auto w-full text-center animate-in slide-in-from-right duration-500">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Pick a look.</h2>
                                <p className="text-slate-500 font-medium">Upload a profile picture.</p>
                            </div>

                            {renderDots(3, 4)}
                            
                            <div className="flex justify-center">
                                <label className="w-40 h-40 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-slate-50 cursor-pointer hover:bg-slate-200 transition-colors group relative">
                                    {avatarFile ? (
                                        <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl text-slate-300 group-hover:text-slate-400 transition-colors">+</span>
                                    )}
                                    <input type="file" onChange={e => e.target.files && setAvatarFile(e.target.files[0])} className="hidden" accept="image/*"/>
                                </label>
                            </div>

                            <div className="space-y-3">
                                <button onClick={() => handleAvatarUpload(false)} disabled={!avatarFile} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100">
                                    Finish
                                </button>
                                <button onClick={() => handleAvatarUpload(true)} className="text-slate-400 font-bold text-sm hover:text-slate-600">Skip</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
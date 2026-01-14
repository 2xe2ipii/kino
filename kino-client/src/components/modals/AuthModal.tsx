import { useContext, useState, useEffect } from 'react';
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
    const [resendTimer, setResendTimer] = useState(0);

    // Onboarding Data
    const [displayName, setDisplayName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // --- FIX: Prevent Infinite Render Loop ---
    useEffect(() => {
        if (modalType === 'REGISTER') {
            setStep(STEP_REGISTER);
            setResendTimer(0);
        } else if (modalType === 'LOGIN') {
            setStep(STEP_LOGIN);
        }
        setError('');
        setLoading(false);
    }, [modalType]); // Only run when modal opens/changes type

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => setResendTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    if (!modalType) return null;

    // --- ACTIONS ---

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            login(res.data.token, res.data.username, true);
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
            setResendTimer(30);
        } catch (err: any) {
            setError(err.response?.data?.[0]?.description || 'Registration failed');
        } finally { setLoading(false); }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/auth/verify-email', { userId, token: verificationCode });
            login(res.data.token, res.data.username, false); // Keep open
            setStep(STEP_ONBOARD_PROFILE);
        } catch (err: any) {
            setError('Invalid code.');
        } finally { setLoading(false); }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        setLoading(true); setError('');
        try {
            await api.post('/auth/resend-verification', { userId });
            setResendTimer(30);
            alert("Code resent!"); 
        } catch (e) {
            setError('Failed to resend.');
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
        if (skip) { finishOnboarding(); return; }
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
        window.location.reload(); 
    };

    // --- UI HELPERS ---

    const renderDots = (current: number, total: number) => (
        <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= current ? 'w-8 bg-rose-500' : 'w-2 bg-slate-200'}`} />
            ))}
        </div>
    );

    const renderOtpInput = () => (
        <div className="relative w-full max-w-[320px] mx-auto mb-6">
            <div className="flex justify-between gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div 
                        key={idx}
                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-200
                        ${verificationCode.length === idx ? 'border-rose-500 shadow-lg shadow-rose-100 scale-105 bg-white' : 'border-slate-100 bg-slate-50 text-slate-800'}
                        ${verificationCode.length > idx ? 'border-slate-200 bg-white' : ''}
                        `}
                    >
                        {verificationCode[idx] || ''}
                    </div>
                ))}
            </div>
            <input 
                type="text" 
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setVerificationCode(val);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text font-mono tracking-widest"
                autoFocus
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[550px] flex flex-col transition-all">
                
                <button onClick={closeModal} className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 z-20 transition-colors p-2 hover:bg-slate-50 rounded-full">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {loading && <div className="absolute inset-0 bg-white/95 z-30 flex items-center justify-center backdrop-blur-sm"><Loading /></div>}

                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center items-center">
                    <div className="w-full max-w-[420px] flex flex-col">

                        {/* --- 1. LOGIN --- */}
                        {step === STEP_LOGIN && (
                            <form onSubmit={handleLogin} className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-10">
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Welcome back.</h2>
                                    <p className="text-slate-500 font-medium text-lg">Sign in to your Kino diary.</p>
                                </div>

                                {error && <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-sm font-bold text-center border border-rose-100">{error}</div>}
                                
                                <div className="space-y-3">
                                    <input type="text" placeholder="Username" className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400" value={username} onChange={e => setUsername(e.target.value)} />
                                    <input type="password" placeholder="Password" className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>

                                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform active:scale-[0.98]">
                                    Login
                                </button>

                                <div className="text-center pt-6">
                                    <span className="text-slate-400 font-bold text-sm">No account? </span>
                                    <button type="button" onClick={() => setStep(STEP_REGISTER)} className="text-rose-500 font-black text-sm hover:underline">Join Club</button>
                                </div>
                            </form>
                        )}

                        {/* --- 2. REGISTER --- */}
                        {step === STEP_REGISTER && (
                            <form onSubmit={handleRegister} className="space-y-6 w-full animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center mb-8">
                                    <h2 className="text-4xl font-black text-rose-500 tracking-tighter mb-2">Join the Club.</h2>
                                    <p className="text-slate-500 font-medium text-lg">Create your Kino account.</p>
                                </div>

                                {renderDots(0, 4)}

                                {error && <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-sm font-bold text-center border border-rose-100">{error}</div>}
                                
                                <div className="space-y-3">
                                    <input type="text" placeholder="Username" className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400" value={username} onChange={e => setUsername(e.target.value)} />
                                    <input type="email" placeholder="Email" className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400" value={email} onChange={e => setEmail(e.target.value)} />
                                    <input type="password" placeholder="Password" className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-400" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>

                                <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-[0.98]">
                                    Verify
                                </button>

                                <div className="text-center pt-6">
                                    <span className="text-slate-400 font-bold text-sm">Have an account? </span>
                                    <button type="button" onClick={() => setStep(STEP_LOGIN)} className="text-slate-800 font-black text-sm hover:underline">Login</button>
                                </div>
                            </form>
                        )}

                        {/* --- 3. VERIFY --- */}
                        {step === STEP_VERIFY && (
                            <form onSubmit={handleVerify} className="space-y-8 w-full text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Check email.</h2>
                                    <p className="text-slate-500 font-medium">We sent a code to <br/><span className="text-slate-800 font-bold">{email}</span></p>
                                </div>

                                {renderDots(1, 4)}

                                {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl text-xs font-bold">{error}</div>}

                                {renderOtpInput()}

                                <div className="space-y-3">
                                    <button type="submit" disabled={verificationCode.length !== 6} className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100">
                                        Continue
                                    </button>
                                    
                                    <button type="button" onClick={handleResendCode} disabled={resendTimer > 0} className="text-slate-400 font-bold text-xs hover:text-rose-500 disabled:text-slate-300 transition-colors uppercase tracking-widest">
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* --- 4. PROFILE --- */}
                        {step === STEP_ONBOARD_PROFILE && (
                            <form onSubmit={handleSaveProfile} className="space-y-8 w-full text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Who are you?</h2>
                                    <p className="text-slate-500 font-medium">Your username is @{username}. <br/>Pick a public name.</p>
                                </div>

                                {renderDots(2, 4)}

                                <input type="text" placeholder="e.g. Marty McFly" className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl font-bold text-2xl text-slate-800 outline-none focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-slate-300 text-center" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus />

                                <button type="submit" disabled={!displayName} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100">
                                    Next
                                </button>
                            </form>
                        )}

                        {/* --- 5. AVATAR --- */}
                        {step === STEP_ONBOARD_AVATAR && (
                            <div className="space-y-8 w-full text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Pick a look.</h2>
                                    <p className="text-slate-500 font-medium">Upload a profile picture.</p>
                                </div>

                                {renderDots(3, 4)}
                                
                                <div className="flex justify-center py-4">
                                    <label className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl shadow-slate-100 cursor-pointer hover:scale-105 transition-transform group relative">
                                        {avatarFile ? (
                                            <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <svg className="w-12 h-12 text-slate-300 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload</span>
                                            </div>
                                        )}
                                        <input type="file" onChange={e => e.target.files && setAvatarFile(e.target.files[0])} className="hidden" accept="image/*"/>
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <button onClick={() => handleAvatarUpload(false)} disabled={!avatarFile} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100">
                                        Finish
                                    </button>
                                    <button onClick={() => handleAvatarUpload(true)} className="text-slate-400 font-bold text-sm hover:text-slate-600">Skip</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
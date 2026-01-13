import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

type ViewState = 'LOGIN' | 'REGISTER' | 'VERIFY';

export const AuthModal = () => {
    const { isModalOpen, modalView, closeModal, login } = useContext(AuthContext)!;
    const [view, setView] = useState<ViewState>('LOGIN');
    
    // Form Data
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    
    // UI State
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- OTP LOGIC ---
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isModalOpen) {
            setView(modalView); 
            setError('');
            setOtp(['', '', '', '', '', '']); 
            if (!userId) {
                setUsername('');
                setPassword('');
                setEmail('');
            }
        }
    }, [isModalOpen, modalView]); 

    const handleOtpChange = (index: number, value: string) => {
        if (loading) return; // Block input if loading
        if (isNaN(Number(value))) return; 
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); 
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (loading) return;
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        if (loading) return;
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        if (data.every(char => !isNaN(Number(char)))) {
            const newOtp = [...otp];
            data.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
            setOtp(newOtp);
            otpRefs.current[Math.min(data.length, 5)]?.focus();
        }
    };

    // --- API HANDLERS ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            login(res.data.token);
        } catch (err: any) {
            const data = err.response?.data;
            setError(typeof data === 'string' ? data : (data?.message || 'Invalid credentials.'));
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
            const newUserId = res.data.userId || res.data.UserId;
            setUserId(newUserId); 
            setView('VERIFY');
        } catch (err: any) {
            const data = err.response?.data;
            let msg = 'Failed to register.';
            if (typeof data === 'string') msg = data;
            else if (data?.message) msg = data.message;
            else if (Array.isArray(data)) msg = data.map((e: any) => e.description).join(' ');
            else if (data?.errors) { const k = Object.keys(data.errors)[0]; msg = `${k}: ${data.errors[k][0]}`; }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
        
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-email', { userId, token: code });
            const loginRes = await api.post('/auth/login', { username, password });
            login(loginRes.data.token);
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Invalid code.');
        } finally {
            setLoading(false);
        }
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={loading ? undefined : closeModal} />

            <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem] overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

                {/* FIX 1: Z-Index 50 ensures this is always clickable 
                   Added disabled state to prevent closing while submitting
                */}
                <button 
                    onClick={closeModal} 
                    disabled={loading}
                    className="absolute top-6 right-6 z-50 p-2 rounded-full hover:bg-black/5 transition-colors text-slate-400 hover:text-rose-500 disabled:opacity-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {view === 'LOGIN' && 'Welcome Back'}
                        {view === 'REGISTER' && 'Create Account'}
                        {view === 'VERIFY' && 'Verify Email'}
                    </h2>
                    <p className="text-xs font-bold text-rose-500 tracking-[0.2em] uppercase mt-2 opacity-80">
                        {view === 'VERIFY' ? `Code sent to ${email}` : 'The Movie Diary'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-rose-50/80 backdrop-blur-sm text-rose-600 text-xs text-center rounded-xl font-semibold border border-rose-100 animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {view === 'LOGIN' && (
                    <form onSubmit={handleLogin} className="space-y-4 relative z-10" autoComplete="off">
                        <div className="space-y-4">
                            <InputGroup disabled={loading} name="kino_username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            <InputGroup disabled={loading} name="kino_password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <SubmitButton loading={loading} label="Sign In" />
                        <FooterLink disabled={loading} text="New here? Create account" onClick={() => setView('REGISTER')} />
                    </form>
                )}

                {view === 'REGISTER' && (
                    <form onSubmit={handleRegister} className="space-y-4 relative z-10" autoComplete="off">
                        <div className="space-y-4">
                            <InputGroup disabled={loading} name="kino_reg_username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            <InputGroup disabled={loading} name="kino_reg_email" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <InputGroup disabled={loading} name="kino_reg_password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <SubmitButton loading={loading} label="Create Account" />
                        <FooterLink disabled={loading} text="Already have an account? Sign in" onClick={() => setView('LOGIN')} />
                    </form>
                )}

                {view === 'VERIFY' && (
                    <form onSubmit={handleVerify} className="space-y-8 relative z-10" autoComplete="off">
                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    disabled={loading}
                                    ref={el => { otpRefs.current[i] = el }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all shadow-sm text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            ))}
                        </div>
                        <SubmitButton loading={loading} label="Verify & Login" />
                        <FooterLink disabled={loading} text="Wrong email? Go back" onClick={() => setView('REGISTER')} />
                    </form>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

interface InputGroupProps {
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    disabled?: boolean;
}

const InputGroup = ({ type, placeholder, value, onChange, name, disabled }: InputGroupProps) => {
    // State to toggle visibility
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    
    // Determine the actual input type to render
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="relative group">
            <input 
                name={name}
                type={inputType}
                disabled={disabled}
                placeholder=" " 
                autoComplete={type === 'password' ? 'new-password' : 'off'}
                // Added 'pr-12' (padding-right) to prevent text from overlapping the eye icon
                className="peer w-full bg-white/50 border border-slate-200 rounded-xl px-4 pt-6 pb-2 pr-12 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition-all shadow-sm group-hover:bg-white/80 disabled:opacity-60 disabled:cursor-not-allowed" 
                value={value} 
                onChange={onChange} 
            />
            <label className="absolute left-4 top-4 text-xs font-bold text-slate-400 transition-all pointer-events-none 
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-rose-500 
                peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-rose-500">
                {placeholder}
            </label>

            {/* Render Eye Icon only for password fields */}
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={disabled}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none disabled:opacity-50"
                >
                    {showPassword ? (
                        // Eye Open Icon
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    ) : (
                        // Eye Closed Icon
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
};

const SubmitButton = ({ loading, label }: { loading: boolean, label: string }) => (
    <button disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-slate-200/50 disabled:opacity-70 disabled:cursor-not-allowed">
        {loading ? (
            <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
            </span>
        ) : label}
    </button>
);

const FooterLink = ({ text, onClick, disabled }: { text: string, onClick: () => void, disabled?: boolean }) => (
    <p className={`text-center text-xs font-semibold text-slate-400 mt-4 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-rose-500'}`} onClick={disabled ? undefined : onClick}>
        {text}
    </p>
);
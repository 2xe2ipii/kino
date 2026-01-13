import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/layout/AuthLayout';

// Define the steps for the UI flow
type RegistrationStep = 'REGISTER' | 'VERIFY';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<RegistrationStep>('REGISTER');
    
    // Form States
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- HANDLERS ---

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // - Register Endpoint
            const response = await api.post('/auth/register', formData);
            
            // Capture the UserId returned by the backend for the verification step
            setUserId(response.data.userId); 
            setStep('VERIFY');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // - Verify Email Endpoint
            // Payload matches VerifyEmailDto: { userId, token }
            await api.post('/auth/verify-email', {
                userId: userId,
                token: verificationCode
            });

            // On success, redirect to login
            navigate('/login');
        } catch (err: any) {
            setError('Invalid token. Please check your email and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDER ---

    return (
        <AuthLayout 
            title={step === 'REGISTER' ? "Join the Club" : "Check your Inbox"} 
            subtitle={step === 'REGISTER' ? "Start your cinematic journey" : `We sent a code to ${formData.email}`}
        >
            {error && (
                <div className="mb-6 p-3 bg-red-50/50 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-lg text-center animate-pulse">
                    {error}
                </div>
            )}

            {step === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1">
                        <input 
                            type="text" 
                            required
                            className="w-full px-5 py-4 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white/80 transition-all text-slate-700 placeholder-slate-400 text-sm font-medium shadow-sm"
                            placeholder="Username"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <input 
                            type="email" 
                            required
                            className="w-full px-5 py-4 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white/80 transition-all text-slate-700 placeholder-slate-400 text-sm font-medium shadow-sm"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <input 
                            type="password" 
                            required
                            className="w-full px-5 py-4 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white/80 transition-all text-slate-700 placeholder-slate-400 text-sm font-medium shadow-sm"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 mt-4 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-300/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating Account...' : 'Get Ticket'}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Already a member?{' '}
                            <Link to="/login" className="text-rose-500 font-bold hover:underline decoration-2 underline-offset-2">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </form>
            )}

            {step === 'VERIFY' && (
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4 animate-bounce">
                            <span className="text-2xl">💌</span>
                        </div>
                        <p className="text-sm text-slate-600 px-4">
                            Paste the verification code sent to your email to activate your account.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            Verification Token
                        </label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-5 py-4 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white/80 transition-all text-slate-800 placeholder-slate-400 text-center font-mono text-lg tracking-wide shadow-sm"
                            placeholder="Paste code here"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-300/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                    >
                        {isLoading ? 'Verifying...' : 'Activate Account'}
                    </button>
                    
                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => setStep('REGISTER')}
                            className="text-xs text-slate-400 hover:text-rose-500 underline"
                        >
                            Back to Register
                        </button>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
};

export default Register;
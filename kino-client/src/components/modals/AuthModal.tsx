import { useContext, useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../context/AuthContext';

export const AuthModal = () => {
    const { modalType, closeModal, loginWithGoogle } = useContext(AuthContext)!;
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsSignUp(modalType === 'REGISTER');
        setError('');
        setLoading(false);
    }, [modalType]);

    if (!modalType) return null;

    const handleGoogleSuccess = async (credential: string) => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle(credential);
        } catch {
            setError('Sign-in failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 relative overflow-hidden">

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                        <svg className="animate-spin h-10 w-10 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-sm font-bold text-slate-500">Signing you in…</p>
                    </div>
                )}

                <button
                    onClick={closeModal}
                    disabled={loading}
                    className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full disabled:opacity-0"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-4xl font-black text-rose-500 tracking-tighter mb-2">kino.</h2>
                    <p className="text-slate-500 font-medium text-lg">
                        {isSignUp ? 'Join the club.' : 'Welcome back.'}
                    </p>
                </div>

                <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={({ credential }) => handleGoogleSuccess(credential!)}
                        onError={() => { setError('Google sign-in failed. Please try again.'); }}
                        text={isSignUp ? 'signup_with' : 'signin_with'}
                        shape="rectangular"
                        size="large"
                        width="320"
                    />
                </div>

                {error && (
                    <p className="text-rose-500 text-sm font-bold text-center -mt-4">{error}</p>
                )}

                <div className="text-center pt-2">
                    <p className="text-slate-400 font-bold text-sm">
                        {isSignUp ? 'Already a member?' : 'New to Kino?'}
                        {' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-rose-500 font-black hover:underline"
                        >
                            {isSignUp ? 'Sign In' : 'Join Club'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

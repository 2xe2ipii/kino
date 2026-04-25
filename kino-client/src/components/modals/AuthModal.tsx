import { useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../context/AuthContext';

export const AuthModal = () => {
    const { modalType, closeModal, loginWithGoogle } = useContext(AuthContext)!;

    if (!modalType) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 relative">

                <button
                    onClick={closeModal}
                    className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-4xl font-black text-rose-500 tracking-tighter mb-2">kino.</h2>
                    <p className="text-slate-500 font-medium text-lg">Your personal film diary.</p>
                </div>

                <GoogleLogin
                    onSuccess={({ credential }) => loginWithGoogle(credential!)}
                    onError={() => console.error('Google login failed')}
                    text="continue_with"
                    shape="rectangular"
                    size="large"
                />
            </div>
        </div>
    );
};

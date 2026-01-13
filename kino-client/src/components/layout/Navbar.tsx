import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export const Navbar = () => {
    const { user, isAuthenticated, openModal, logout } = useContext(AuthContext)!;

    return (
        <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4">
            <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
                
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-rose-600 tracking-tighter select-none">kino.</span>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <span className="hidden md:block text-sm font-bold text-slate-600">
                                {user?.sub}
                            </span>
                            <button 
                                onClick={logout}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                            >
                                Sign Out
                            </button>
                            {/* Simple User Icon SVG */}
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => openModal('LOGIN')} 
                                className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => openModal('REGISTER')} 
                                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-200 transition-transform active:scale-95"
                            >
                                Join Club
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
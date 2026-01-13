import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = () => {
    // 1. Destructure all needed values from Context
    const { user, userAvatar, isAuthenticated, openModal, logout } = useContext(AuthContext)!;
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4">
            <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
                
                {/* Logo Link */}
                <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <span className="text-2xl font-black text-rose-600 tracking-tighter select-none">kino.</span>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            
                            {/* Profile Link Area */}
                            <div 
                                onClick={() => navigate('/profile')} 
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <span className="hidden md:block text-sm font-bold text-slate-600">
                                    {user?.sub}
                                </span>
                                
                                {/* Avatar Circle */}
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 overflow-hidden border border-rose-200">
                                    {userAvatar ? (
                                        <img 
                                            src={userAvatar} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        // Fallback Initial
                                        <span className="font-bold text-lg">
                                            {user?.sub?.substring(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={logout}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors ml-2"
                            >
                                Sign Out
                            </button>
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
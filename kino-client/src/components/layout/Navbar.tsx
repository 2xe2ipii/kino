import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export const Navbar = () => {
    const { user, isAuthenticated, openModal, logout } = useContext(AuthContext)!;

    return (
        <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4">
            <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
                
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-rose-600 tracking-tighter">kino.</span>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-6">
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 p-[2px]">
                                <div className="w-full h-full rounded-full bg-white border-2 border-transparent overflow-hidden">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/micah/svg?seed=${user?.sub}&backgroundColor=ffdfbf`} 
                                        alt="Avatar" 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={openModal} 
                            className="text-sm font-bold text-slate-600 hover:text-rose-500 transition-colors"
                        >
                            Sign In / Register
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export const Navbar = () => {
    const { user, userAvatar, isAuthenticated, openModal, logout } = useContext(AuthContext)!;
    const navigate = useNavigate();

    // Member Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length > 1) {
            try {
                const res = await api.get(`/users/search?query=${val}`);
                setSearchResults(res.data);
                setShowResults(true);
            } catch (e) {
                console.error(e);
            }
        } else {
            setShowResults(false);
        }
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4">
            <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center relative">
                
                {/* Logo Link */}
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-black text-rose-600 tracking-tighter select-none">kino.</span>
                    </Link>

                    {/* Member Search Bar (Visible only when logged in) */}
                    {isAuthenticated && (
                        <div className="relative hidden md:block group">
                            <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input 
                                    type="text" 
                                    placeholder="Find members..." 
                                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400 w-40"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                    onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                                />
                            </div>
                            
                            {/* Search Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                                    {searchResults.map(u => (
                                        <div key={u.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50 cursor-pointer">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                                {u.avatarUrl && <img src={u.avatarUrl} className="w-full h-full object-cover"/>}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{u.displayName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <div 
                                onClick={() => navigate('/profile')} 
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <span className="hidden md:block text-sm font-bold text-slate-600">
                                    {user?.sub}
                                </span>
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 overflow-hidden border border-rose-200">
                                    {userAvatar ? (
                                        <img 
                                            src={userAvatar} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
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
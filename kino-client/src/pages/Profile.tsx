import { useContext, useEffect, useState, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface ProfileStats {
    totalMovies: number;
    thisYear: number;
}

interface UserProfileData {
    displayName: string;
    avatarUrl: string;
    bio: string;
    favoriteMovie: string;
}

export default function Profile() {
    const { user } = useContext(AuthContext)!;
    const [stats, setStats] = useState<ProfileStats>({ totalMovies: 0, thisYear: 0 });
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    
    const [profileData, setProfileData] = useState<UserProfileData>({ 
        displayName: '', 
        avatarUrl: '', 
        bio: '', 
        favoriteMovie: '' 
    });
    
    const [isEditing, setIsEditing] = useState(false);
    
    // Form Refs
    const nameRef = useRef<HTMLInputElement>(null);
    const photoRef = useRef<HTMLInputElement>(null);
    const bioRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // 1. Get Reviews for Stats
        api.get('/reviews').then(res => {
            const allReviews = res.data;
            const currentYear = new Date().getFullYear();
            setStats({
                totalMovies: allReviews.length,
                thisYear: allReviews.filter((r: any) => new Date(r.createdAt).getFullYear() === currentYear).length
            });
            setRecentReviews(allReviews.slice(0, 4));
        });

        // 2. Get Profile Data
        api.get('/auth/profile')
            .then(res => setProfileData(res.data))
            .catch(() => console.log("No profile data found."));
    }, []);

    const handleSaveProfile = async () => {
        const payload = {
            displayName: nameRef.current?.value || '',
            avatarUrl: photoRef.current?.value || '',
            bio: bioRef.current?.value || '',
            favoriteMovie: profileData.favoriteMovie // Keep existing fav movie hidden
        };
        
        try {
            await api.put('/auth/profile', payload);
            setProfileData(payload);
            setIsEditing(false);
        } catch (error) {
            alert("Failed to save profile");
        }
    };

    // Determine what name/avatar to show
    const displayName = profileData.displayName || user?.sub || "Member";
    const avatarSrc = profileData.avatarUrl || null;
    const initial = displayName.substring(0, 1).toUpperCase();

    return (
        <div className="min-h-screen bg-pink-50 pb-20 font-sans text-slate-800">
            <Navbar />
            
            {/* --- HEADER SECTION --- */}
            <div className="bg-white border-b border-slate-100 pt-32 pb-10 px-6">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Header Top Row: Avatar + Actions */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                        
                        {/* Avatar Circle */}
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 rounded-full bg-rose-100 p-1 ring-4 ring-white shadow-xl overflow-hidden">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-5xl text-white font-black">
                                        {initial}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name & Stats */}
                        <div className="flex-1 text-center md:text-left w-full">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                                
                                {/* Name */}
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                        {displayName}
                                    </h1>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">
                                        Member since 2026
                                    </p>
                                </div>

                                {/* EDIT BUTTON (Top Right) */}
                                {!isEditing && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-center md:justify-start gap-8 border-t border-slate-100 pt-4 md:border-none md:pt-0">
                                <div className="text-center md:text-left">
                                    <div className="text-2xl font-black text-rose-500">{stats.totalMovies}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Films</div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-2xl font-black text-slate-700">{stats.thisYear}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Year</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EDIT FORM (Shows when editing) */}
                    {isEditing && (
                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
                                Edit Profile
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Display Name</label>
                                    <input 
                                        ref={nameRef}
                                        defaultValue={profileData.displayName}
                                        placeholder="Your Name"
                                        className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Avatar URL</label>
                                    <input 
                                        ref={photoRef}
                                        defaultValue={profileData.avatarUrl}
                                        placeholder="https://example.com/photo.jpg"
                                        className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Bio</label>
                                <textarea 
                                    ref={bioRef}
                                    defaultValue={profileData.bio}
                                    placeholder="Tell us about your favorite films..."
                                    rows={3}
                                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleSaveProfile}
                                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BODY CONTENT --- */}
            <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* LEFT: BIO */}
                <div className="space-y-8">
                    {/* Only show Bio box if user is NOT editing (to avoid clutter) */}
                    {!isEditing && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">About</h3>
                            {profileData.bio ? (
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {profileData.bio}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No bio yet.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: RECENT ACTIVITY */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                        <Link to="/diary" className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline">
                            View Full Diary →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {recentReviews.map((review) => (
                            <div key={review.id} className="group relative aspect-[2/3] bg-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer">
                                <img 
                                    src={`https://image.tmdb.org/t/p/w300${review.movie.posterPath}`} 
                                    alt={review.movie.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="text-white text-center p-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <div className="text-amber-400 text-sm mb-1">{'★'.repeat(review.rating)}</div>
                                        <p className="text-xs font-bold">{review.movie.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {recentReviews.length < 4 && Array.from({ length: 4 - recentReviews.length }).map((_, i) => (
                             <div key={i} className="aspect-[2/3] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4">
                                <span className="text-slate-300 text-xs font-bold">Log a movie</span>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
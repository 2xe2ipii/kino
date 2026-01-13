import { useContext, useEffect, useState, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Cropper from 'react-easy-crop'; // <--- NEW IMPORT
import { getCroppedImg } from '../utils/canvasUtils'; // <--- NEW IMPORT

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

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
    const { user, refreshProfile } = useContext(AuthContext)!;
    
    // Stats & Data
    const [stats, setStats] = useState<ProfileStats>({ totalMovies: 0, thisYear: 0 });
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [profileData, setProfileData] = useState<UserProfileData>({ 
        displayName: '', avatarUrl: '', bio: '', favoriteMovie: '' 
    });
    
    // UI States
    const [isEditing, setIsEditing] = useState(false);
    
    // Cropper States
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempImgSrc, setTempImgSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Refs
    const nameRef = useRef<HTMLInputElement>(null);
    const bioRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // 1. Get Stats
        api.get('/reviews').then(res => {
            const allReviews = res.data;
            const currentYear = new Date().getFullYear();
            setStats({
                totalMovies: allReviews.length,
                thisYear: allReviews.filter((r: any) => new Date(r.createdAt).getFullYear() === currentYear).length
            });
            setRecentReviews(allReviews.slice(0, 4));
        });

        // 2. Get Profile
        api.get('/auth/profile')
            .then(res => setProfileData(res.data))
            .catch(() => console.log("No profile data found."));
    }, []);

    // --- CROPPER HANDLERS ---
    
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setTempImgSrc(imageDataUrl as string);
            setCropModalOpen(true);
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleUploadCroppedImage = async () => {
        if (!tempImgSrc || !croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImg(tempImgSrc, croppedAreaPixels);
            if (!croppedBlob) return;

            const formData = new FormData();
            // Convert blob to file
            const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
            formData.append('file', file);

            await api.post('/auth/upload-avatar', formData);

            refreshProfile(); // Update Navbar
            
            // Update local state
            const res = await api.get('/auth/profile');
            setProfileData(res.data);
            
            setCropModalOpen(false);
            setTempImgSrc(null);
        } catch (e) {
            console.error(e);
            alert("Failed to upload image");
        }
    };

    const handleSaveProfile = async () => {
        try {
            const payload = {
                displayName: nameRef.current?.value || '',
                avatarUrl: profileData.avatarUrl, 
                bio: bioRef.current?.value || '',
                favoriteMovie: profileData.favoriteMovie
            };
            
            await api.put('/auth/profile', payload);
            
            const res = await api.get('/auth/profile');
            setProfileData(res.data);
            setIsEditing(false);
        } catch (error) {
            alert("Failed to save profile");
        }
    };

    const displayName = profileData.displayName || user?.sub || "Member";
    
    const avatarSrc = profileData.avatarUrl 
    ? (profileData.avatarUrl.startsWith('/') 
        ? `${BASE_URL}${profileData.avatarUrl}` // <--- Dynamic!
        : profileData.avatarUrl)
    : null;

    const initial = displayName.substring(0, 1).toUpperCase();

    return (
        <div className="min-h-screen bg-pink-50 pb-20 font-sans text-slate-800">
            <Navbar />
            
            {/* --- CROP MODAL --- */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                        <div className="h-64 relative bg-slate-100">
                             <Cropper
                                image={tempImgSrc!}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Square aspect ratio
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Adjust Photo</h3>
                            <p className="text-sm text-slate-500 mb-4">Drag to position, scroll to zoom.</p>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleUploadCroppedImage}
                                    className="flex-1 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600"
                                >
                                    Save Photo
                                </button>
                                <button 
                                    onClick={() => setCropModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="bg-white border-b border-slate-100 pt-32 pb-10 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                        
                        {/* Avatar (Click to Edit) */}
                        <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-full bg-rose-100 p-1 ring-4 ring-white shadow-xl overflow-hidden relative">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-5xl text-white font-black">
                                        {initial}
                                    </div>
                                )}
                                
                                {/* Overlay Icon */}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Hidden Input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={onFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>

                        {/* Name & Stats */}
                        <div className="flex-1 text-center md:text-left w-full">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">{displayName}</h1>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">Member since 2026</p>
                                </div>
                                {!isEditing && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                            <div className="flex justify-center md:justify-start gap-8 border-t border-slate-100 pt-4 md:border-none md:pt-0">
                                <div><div className="text-2xl font-black text-rose-500">{stats.totalMovies}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Films</div></div>
                                <div><div className="text-2xl font-black text-slate-700">{stats.thisYear}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Year</div></div>
                            </div>
                        </div>
                    </div>

                    {/* EDIT FORM */}
                    {isEditing && (
                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Edit Profile</h3>
                            <div className="grid grid-cols-1 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Display Name</label>
                                    <input ref={nameRef} defaultValue={profileData.displayName} className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Bio</label>
                                <textarea ref={bioRef} defaultValue={profileData.bio} rows={3} className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-sm" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleSaveProfile} className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors">Save Changes</button>
                                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body (Bio & Recent) */}
            <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="space-y-8">
                    {!isEditing && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">About</h3>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{profileData.bio || "No bio yet."}</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                        <Link to="/diary" className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline">View Full Diary →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {recentReviews.map((review) => (
                            <div key={review.id} className="group relative aspect-[2/3] bg-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer">
                                <img src={`https://image.tmdb.org/t/p/w300${review.movie.posterPath}`} alt={review.movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export default function PublicProfile() {
    const { username } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [profileRes, reviewsRes] = await Promise.all([
                    api.get(`/users/${username}`),
                    api.get(`/reviews/user/${username}`),
                ]);
                setProfile(profileRes.data);
                setReviews(reviewsRes.data);
            } catch {
                console.error('Failed to load user');
            } finally {
                setLoading(false);
            }
        }
        if (username) loadData();
    }, [username]);

    if (loading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center font-bold text-rose-400 animate-pulse">Loading Member...</div>;
    if (!profile) return <div className="min-h-screen bg-pink-50 flex items-center justify-center font-bold text-slate-400">User Not Found</div>;

    const avatarSrc = profile.avatarUrl
        ? (profile.avatarUrl.startsWith('/') ? `${BASE_URL}${profile.avatarUrl}` : profile.avatarUrl)
        : null;

    return (
        <div className="min-h-screen bg-pink-50 pb-20 font-sans text-slate-800">
            <Navbar />

            <div className="bg-white border-b border-slate-100 pt-32 pb-10 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-8">
                    <div className="w-32 h-32 rounded-full bg-slate-200 p-1 ring-4 ring-white shadow-xl overflow-hidden">
                        {avatarSrc ? (
                            <img src={avatarSrc} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-300 text-4xl font-black text-white">
                                {profile.displayName?.[0] || '?'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{profile.displayName}</h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">@{profile.username}</p>
                        <div className="flex justify-center md:justify-start gap-8 mt-6">
                            <div><div className="text-2xl font-black text-rose-500">{reviews.length}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Films</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">About</h3>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{profile.bio || 'No bio.'}</p>
                    </div>

                    {profile.topMovies?.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Films</h3>
                            <div className="space-y-2">
                                {profile.topMovies.map((m: any) => (
                                    <div key={m.rank} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-300 w-4">{m.rank}</span>
                                        {m.posterPath && (
                                            <img src={`https://image.tmdb.org/t/p/w92${m.posterPath}`} className="w-8 h-12 object-cover rounded" alt={m.title} />
                                        )}
                                        <span className="text-sm font-bold text-slate-700 line-clamp-1">{m.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                    {reviews.length === 0 && <p className="text-slate-400 text-sm">No reviews yet.</p>}
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                <div className="w-16 h-24 shrink-0 bg-slate-200 rounded-lg overflow-hidden">
                                    <img src={`https://image.tmdb.org/t/p/w200${review.movie.posterPath}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 mb-1">{review.movie.title} <span className="font-normal text-slate-400">({review.movie.year})</span></div>
                                    <div className="flex gap-2 mb-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">Tech: {review.ratingTechnical}%</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 rounded text-rose-500">Fun: {review.ratingEnjoyment}%</span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{review.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

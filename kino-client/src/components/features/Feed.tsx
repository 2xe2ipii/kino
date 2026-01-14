import { useEffect, useState } from 'react';
import api from '../../api/axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const Feed = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        try {
            const res = await api.get('/reviews/feed');
            setReviews(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (id: number) => {
        try {
            setReviews(prev => prev.map(r => {
                if (r.id === id) {
                    return { ...r, likes: r.isLikedByMe ? r.likes - 1 : r.likes + 1, isLikedByMe: !r.isLikedByMe };
                }
                return r;
            }));
            await api.post(`/reviews/${id}/like`);
        } catch (e) {
            console.error(e);
            loadFeed(); // Revert on error
        }
    };

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <span className="bg-rose-500 w-2 h-8 rounded-full"></span>
                 Global Review Feed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex gap-5 hover:shadow-md transition-shadow">
                        {/* Poster */}
                        <div className="shrink-0 w-20 aspect-[2/3] bg-slate-200 rounded-xl overflow-hidden shadow-inner">
                             <img src={`https://image.tmdb.org/t/p/w200${review.movie.posterPath}`} className="w-full h-full object-cover" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                                    {review.author?.avatarUrl && (
                                        <img src={review.author.avatarUrl.startsWith('/') ? `${BASE_URL}${review.author.avatarUrl}` : review.author.avatarUrl} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="truncate">
                                    <span className="text-xs font-bold text-slate-800 mr-1">{review.author?.displayName || 'Member'}</span>
                                    <span className="text-xs text-slate-400">watched <span className="text-rose-500 font-bold">{review.movie.title}</span></span>
                                </div>
                            </div>

                            {/* Ratings */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {review.ratingTechnical}%
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    {review.ratingEnjoyment}%
                                </div>
                            </div>

                            <p className="text-slate-600 text-xs leading-relaxed mb-auto line-clamp-3">{review.content}</p>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                                <button 
                                    onClick={() => handleLike(review.id)}
                                    className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${review.isLikedByMe ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <svg className={`w-3.5 h-3.5 ${review.isLikedByMe ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {review.likes}
                                </button>
                                <span className="text-[10px] text-slate-300">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
import { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface Review {
    id: number;
    rating: number;
    content: string;
    createdAt: string;
    movie: {
        title: string;
        posterPath: string;
        year: number;
    };
}

const Diary = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await api.get('/reviews');
                setReviews(res.data);
            } catch (error) {
                console.error("Failed to fetch diary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    return (
        <div className="min-h-screen bg-pink-50 pb-20 font-sans text-slate-800">
            <Navbar />
            <div className="pt-28 px-6 max-w-5xl mx-auto">
                
                {/* --- 1. CLEANER NAVIGATION --- */}
                <div className="mb-6">
                    <Link 
                        to="/profile" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Profile
                    </Link>
                </div>

                <header className="mb-10 pb-6 border-b border-rose-100/50">
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Diary</h1>
                    <p className="text-slate-500 font-medium">
                        Your complete watch history.
                    </p>
                </header>

                {loading ? (
                    <div className="text-center py-20 opacity-50">Loading history...</div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="flex gap-6 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
                                <div className="w-20 h-28 flex-shrink-0 bg-slate-200 rounded-xl overflow-hidden shadow-inner">
                                     <img 
                                        src={`https://image.tmdb.org/t/p/w200${review.movie.posterPath}`} 
                                        alt={review.movie.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/200x300?text=No+Poster';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 py-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-slate-800">{review.movie.title}</h3>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <div className="flex text-amber-400 text-sm mt-1 mb-3">
                                        {'★'.repeat(review.rating)}
                                        <span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span>
                                    </div>
                                    
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {review.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Diary;
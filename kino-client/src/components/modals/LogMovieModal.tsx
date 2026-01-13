import { useState } from 'react';
import { StarRating } from '../ui/StarRating';
import api from '../../api/axios';

interface LogMovieModalProps {
    movie: any; // Using 'any' for TMDB result shape for now
    isOpen: boolean;
    onClose: () => void;
}

export const LogMovieModal = ({ movie, isOpen, onClose }: LogMovieModalProps) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [dateWatched, setDateWatched] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !movie) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Ensure Movie exists in our DB (Optional, depending on backend logic)
            // For now, we assume the backend handles "Create if not exists" or we just send the log
            
            // 2. Post the Review/Log
            // Note: Assuming a /reviews endpoint exists based on SRS requirements
            await api.post('/reviews', {
                movieId: movie.id, // TMDB ID
                movieTitle: movie.title,
                posterPath: movie.poster_path,
                rating,
                content: review,
                dateWatched
            });
            onClose();
        } catch (error) {
            console.error("Failed to log movie", error);
            alert("Failed to save diary entry.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Left: Poster */}
                <div className="w-full md:w-1/3 h-64 md:h-auto relative bg-slate-100">
                    <img 
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/400x600?text=No+Poster'} 
                        alt={movie.title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 text-white">
                        <h3 className="font-bold text-xl leading-tight">{movie.title}</h3>
                        <p className="text-xs opacity-80">{movie.release_date?.split('-')[0]}</p>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="flex-1 p-8 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500">✕</button>
                    
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">I watched...</h2>
                    <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mb-6">{movie.title}</p>

                    <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
                        
                        {/* Date */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">On Date</label>
                            <input 
                                type="date" 
                                required
                                value={dateWatched}
                                onChange={(e) => setDateWatched(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-200"
                            />
                        </div>

                        {/* Rating */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Rating</label>
                            <StarRating rating={rating} setRating={setRating} />
                        </div>

                        {/* Review */}
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Review</label>
                            <textarea 
                                rows={4}
                                placeholder="Add your thoughts..."
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                className="w-full h-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Log Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
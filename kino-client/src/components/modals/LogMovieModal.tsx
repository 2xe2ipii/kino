import { useState } from 'react';
import api from '../../api/axios';

// Outline Icons
const VIBES = [
    { id: 'visual', label: 'Visuals', icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
    { id: 'brain', label: 'Smart', icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
    { id: 'tear', label: 'Sad', icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> },
    { id: 'zzz', label: 'Comfy', icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> },
    { id: 'fire', label: 'Action', icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
];

interface LogMovieModalProps {
    movie: any;
    isOpen: boolean;
    onClose: () => void;
}

export const LogMovieModal = ({ movie, isOpen, onClose }: LogMovieModalProps) => {
    const [ratingTechnical, setRatingTechnical] = useState(50);
    const [ratingEnjoyment, setRatingEnjoyment] = useState(50);
    const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
    
    const [review, setReview] = useState('');
    const [dateWatched, setDateWatched] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !movie) return null;

    const toggleVibe = (id: string) => {
        if (selectedVibes.includes(id)) {
            setSelectedVibes(selectedVibes.filter(v => v !== id));
        } else {
            if (selectedVibes.length < 3) setSelectedVibes([...selectedVibes, id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/reviews', {
                movieId: movie.id,
                movieTitle: movie.title,
                posterPath: movie.poster_path,
                releaseDate: movie.release_date,
                ratingTechnical,   
                ratingEnjoyment,   
                vibeTags: selectedVibes.join(','), 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                
                {/* Left: Poster */}
                <div className="w-full md:w-1/3 h-48 md:h-auto relative bg-slate-900">
                    <img 
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/400x600?text=No+Poster'} 
                        alt={movie.title} 
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex flex-col justify-end p-6 text-white">
                        <h3 className="font-bold text-2xl leading-tight">{movie.title}</h3>
                        <p className="text-sm opacity-70 mt-1">{movie.release_date?.split('-')[0]}</p>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="flex-1 p-8 flex flex-col overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-wider">Log Entry</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* 1. The Matrix (Head vs Heart) */}
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="space-y-2 text-center">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Technical
                                </label>
                                <div className="text-2xl font-black text-slate-700">{ratingTechnical}%</div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={ratingTechnical} 
                                    onChange={(e) => setRatingTechnical(parseInt(e.target.value))}
                                    className="w-full accent-slate-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2 text-center">
                                <label className="text-xs font-bold text-rose-400 uppercase flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    Enjoyment
                                </label>
                                <div className="text-2xl font-black text-rose-500">{ratingEnjoyment}%</div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={ratingEnjoyment} 
                                    onChange={(e) => setRatingEnjoyment(parseInt(e.target.value))}
                                    className="w-full accent-rose-500 h-1.5 bg-rose-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* 2. Vibes */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Vibes (Max 3)</label>
                            <div className="flex flex-wrap gap-2">
                                {VIBES.map(vibe => (
                                    <button
                                        key={vibe.id}
                                        type="button"
                                        onClick={() => toggleVibe(vibe.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                                            selectedVibes.includes(vibe.id)
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        {vibe.icon}
                                        {vibe.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Date & Review */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Date</label>
                                <input 
                                    type="date" 
                                    value={dateWatched}
                                    onChange={(e) => setDateWatched(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-200"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Thoughts</label>
                                    <span className={`text-[10px] font-bold ${review.length >= 500 ? 'text-rose-500' : 'text-slate-300'}`}>
                                        {review.length}/500
                                    </span>
                                </div>
                                <textarea 
                                    maxLength={500} // <--- Max Length Limit
                                    placeholder="Write a review..."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    className="w-full h-32 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-200 resize-none" // <--- Fixed Height & No Resize
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Saving...' : 'Log to Diary'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
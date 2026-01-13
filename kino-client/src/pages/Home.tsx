import { useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { LogMovieModal } from '../components/modals/LogMovieModal';
import { Navbar } from '../components/layout/Navbar';

interface TmdbMovie {
    id: number;
    title: string;
    overview: string;
    release_date: string;
    poster_path: string;
}

const Home = () => {
    const { isAuthenticated, openModal } = useContext(AuthContext)!;
    
    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TmdbMovie[]>([]);
    const [loading, setLoading] = useState(false);

    // Logging State
    const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    // Debounced Search or Manual Search
    const searchMovies = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            //
            const res = await api.get(`/tmdb/search?query=${searchQuery}`);
            setResults(res.data.results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle "Log" Click
    const handleMovieClick = (movie: TmdbMovie) => {
        if (!isAuthenticated) {
            openModal(); // Open Login Modal if not logged in
        } else {
            setSelectedMovie(movie);
            setIsLogModalOpen(true); // Open Log Modal if logged in
        }
    };

    return (
        <div className="min-h-screen bg-pink-50">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                
                {/* Hero / Search Section */}
                <div className="text-center mb-16">
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600 mb-6 tracking-tighter">
                        kino.
                    </h1>
                    
                    <div className="max-w-2xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <input 
                            type="text"
                            placeholder="Search for a film..."
                            className="relative w-full bg-white border-none rounded-2xl py-6 px-8 text-xl shadow-xl text-slate-700 outline-none focus:ring-0 placeholder:text-slate-300"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if(e.target.value.length > 2) searchMovies(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && searchMovies(query)}
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                            🔍
                        </span>
                    </div>
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="text-center text-rose-400 animate-pulse">Searching the archives...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {results.map((movie) => (
                            <div 
                                key={movie.id} 
                                onClick={() => handleMovieClick(movie)}
                                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                            >
                                <div className="aspect-[2/3] bg-slate-200 relative overflow-hidden">
                                    <img 
                                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/400x600?text=No+Image'} 
                                        alt={movie.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-rose-900/0 group-hover:bg-rose-900/60 transition-colors duration-300 flex items-center justify-center">
                                        <button className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-rose-600 font-bold py-2 px-6 rounded-full shadow-lg">
                                            {isAuthenticated ? 'Log Movie' : 'Login to Log'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-800 leading-tight truncate">{movie.title}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{movie.release_date?.split('-')[0] || 'Unknown'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Empty State / Welcome */}
                {!loading && results.length === 0 && (
                    <div className="text-center text-slate-400 mt-20">
                        <p className="text-lg">Type a movie title to start logging.</p>
                    </div>
                )}
            </div>

            {/* The Log Movie Modal */}
            <LogMovieModal 
                movie={selectedMovie} 
                isOpen={isLogModalOpen} 
                onClose={() => setIsLogModalOpen(false)} 
            />
        </div>
    );
};

export default Home;
import { useState, useContext, useEffect, useRef } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { LogMovieModal } from '../components/modals/LogMovieModal';
import { Navbar } from '../components/layout/Navbar';
import { Feed } from '../components/features/Feed';

interface TmdbMovie {
    id: number;
    title: string;
    overview: string;
    release_date: string;
    poster_path: string;
}

const Home = () => {
    const { isAuthenticated, openModal } = useContext(AuthContext)!;
    
    // Search States
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TmdbMovie[]>([]); // Full Grid Results
    const [dropdownResults, setDropdownResults] = useState<TmdbMovie[]>([]); // Quick Dropdown Results
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Category States
    const [recentMovies, setRecentMovies] = useState<TmdbMovie[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<TmdbMovie[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<TmdbMovie[]>([]);
    
    // Modal States
    const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    // Ref for clicking outside dropdown
    const searchRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---

    useEffect(() => {
        // Fetch all categories
        const fetchData = async () => {
            try {
                const [nowPlaying, topRated, upcoming] = await Promise.all([
                    api.get('/tmdb/now-playing'),
                    api.get('/tmdb/top-rated'),
                    api.get('/tmdb/upcoming')
                ]);
                
                setRecentMovies(nowPlaying.data.slice(0, 12));
                setTopRatedMovies(topRated.data.slice(0, 12));
                setUpcomingMovies(upcoming.data.slice(0, 12));
            } catch (err) {
                console.error("Failed to load movies:", err);
            }
        };

        fetchData();
    }, []);

    // 1. Debounced Search for the Dropdown (Typeahead)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 1) {
                performSearch(query, true); // true = update dropdown
            } else {
                setDropdownResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // 2. Close dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- HANDLERS ---

    const performSearch = async (searchQuery: string, isDropdown: boolean) => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const res = await api.get(`/tmdb/search?query=${searchQuery}`);
            const movies = res.data || [];
            
            if (isDropdown) {
                setDropdownResults(movies.slice(0, 5));
                setShowDropdown(true);
            } else {
                setResults(movies); // Full grid update
                setShowDropdown(false); 
            }
        } catch (error) {
            console.error("Search failed.", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            performSearch(query, false);
        }
    };

    const handleMovieClick = (movie: TmdbMovie) => {
        if (!isAuthenticated) {
            openModal('LOGIN');
        } else {
            setSelectedMovie(movie);
            setIsLogModalOpen(true);
        }
        setShowDropdown(false);
    };

    const resetSearch = () => {
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    const isSearching = results.length > 0;

    // Helper Component for consistent Card styling
    const MovieCard = ({ movie }: { movie: TmdbMovie }) => (
        <div 
            onClick={() => handleMovieClick(movie)}
            className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
        >
            <div className="aspect-[2/3] bg-slate-200 relative overflow-hidden">
                <img 
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/400x600?text=No+Image'} 
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-rose-900/0 group-hover:bg-rose-900/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-rose-600 p-3 rounded-full shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-slate-800 leading-tight truncate">{movie.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{movie.release_date?.split('-')[0] || 'Unknown'}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-pink-50 relative pb-20 font-sans text-slate-800">
            <Navbar onLogoClick={resetSearch} />

            <div className="pt-32 px-6 max-w-7xl mx-auto">
                
                {/* --- HERO & SEARCH SECTION --- */}
                <div className="text-center mb-12 relative z-20">
                    <h1 
                        onClick={resetSearch}
                        className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600 mb-6 tracking-tighter select-none cursor-pointer hover:opacity-90 transition-opacity"
                    >
                        kino.
                    </h1>
                    
                    {/* Search Container */}
                    <div ref={searchRef} className="max-w-2xl mx-auto relative group">
                        
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* The Input */}
                        <div className="relative bg-white rounded-2xl shadow-xl flex items-center overflow-hidden">
                            <input 
                                type="text"
                                placeholder="Search for a film..."
                                className="w-full border-none py-6 pl-8 pr-16 text-xl text-slate-700 outline-none placeholder:text-slate-300 font-medium bg-transparent"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleEnterKey}
                                onFocus={() => query.length > 1 && setShowDropdown(true)}
                            />
                            
                            {/* Right Icon */}
                            <div className="absolute right-6 flex items-center justify-center text-slate-300">
                                {loading ? (
                                    <svg className="animate-spin h-6 w-6 text-rose-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* --- DROPDOWN --- */}
                        {showDropdown && dropdownResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Top Results
                                </div>
                                <ul>
                                    {dropdownResults.map((movie) => (
                                        <li 
                                            key={movie.id}
                                            onClick={() => handleMovieClick(movie)}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-rose-50 cursor-pointer transition-colors group/item"
                                        >
                                            <div className="w-10 h-14 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://placehold.co/100x150?text=No'} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-700 truncate group-hover/item:text-rose-600">
                                                    {movie.title}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {movie.release_date?.split('-')[0] || 'Unknown Year'}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div 
                                    onClick={() => performSearch(query, false)}
                                    className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center text-sm font-bold text-rose-500 cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                >
                                    See all results for "{query}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- FEED & CATEGORIES (HIDDEN WHEN SEARCHING) --- */}
                {!isSearching && (
                    <>
                        <div className="mb-20">
                            <Feed /> 
                        </div>

                        {/* Category 1: Fresh Releases */}
                        <div className="mt-12">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="bg-rose-500 w-2 h-8 rounded-full"></span>
                                Fresh Releases
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {recentMovies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
                            </div>
                        </div>

                        {/* Category 2: Critically Acclaimed */}
                        <div className="mt-12">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="bg-amber-400 w-2 h-8 rounded-full"></span>
                                Critically Acclaimed
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {topRatedMovies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
                            </div>
                        </div>

                        {/* Category 3: Coming Soon */}
                        <div className="mt-12 mb-20">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="bg-indigo-500 w-2 h-8 rounded-full"></span>
                                Coming Soon
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {upcomingMovies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
                            </div>
                        </div>
                    </>
                )}

                {/* --- MAIN SEARCH RESULTS --- */}
                {isSearching && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold text-slate-700">Search Results</h2>
                            <div className="h-px flex-1 bg-slate-200"></div>
                            <button 
                                onClick={resetSearch}
                                className="text-sm font-bold text-rose-500 hover:text-rose-600"
                            >
                                Clear Results
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {results.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Developer Credits */}
            <div className="fixed bottom-4 right-6 pointer-events-none z-0 text-right flex flex-col items-end gap-2">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest opacity-60">
                    Developed by <span className="font-bold text-slate-500">2xe2ipi</span>
                </p>
                <div className="flex items-center gap-2 opacity-50">
                    <img 
                        src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
                        alt="TMDB Logo" 
                        className="h-3" 
                    />
                    <p className="text-[8px] text-slate-400 max-w-[150px] leading-tight">
                        This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </p>
                </div>
            </div>

            <LogMovieModal 
                movie={selectedMovie} 
                isOpen={isLogModalOpen} 
                onClose={() => setIsLogModalOpen(false)} 
            />
        </div>
    );
};

export default Home;
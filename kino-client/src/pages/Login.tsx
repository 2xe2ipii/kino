import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/layout/AuthLayout';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext)!;
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { username, password });
            login(response.data.token);
            navigate('/'); 
        } catch (err: any) {
            setError('Invalid credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout 
            title="Sign In" 
            subtitle="Curate your digital cinema"
        >
            {error && (
                <div className="mb-6 p-3 bg-red-50/50 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-lg text-center">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <input 
                        type="text" 
                        required
                        className="w-full px-5 py-4 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white/80 transition-all text-slate-700 placeholder-slate-400 text-sm font-medium shadow-sm"
                        placeholder="Username"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                </div>

                <div className="space-y-1">
                    <input 
                        type="password" 
                        required
                        className="w-full px-5 py-4 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white/80 transition-all text-slate-700 placeholder-slate-400 text-sm font-medium shadow-sm"
                        placeholder="Password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <div className="flex justify-end pt-2">
                        <a href="#" className="text-xs text-rose-500/80 hover:text-rose-600 font-semibold transition-colors">
                            Forgot password?
                        </a>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 mt-4 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-300/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Signing In...' : 'Login'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                    New here?{' '}
                    <Link to="/register" className="text-rose-500 font-bold hover:underline decoration-2 underline-offset-2">
                        Create Account
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Login;
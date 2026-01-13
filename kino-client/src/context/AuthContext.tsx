import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios'; // <--- FIX: Added missing import

interface User {
    sub: string;
    jti: string;
}

export type ModalView = 'LOGIN' | 'REGISTER';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    userAvatar: string | null;      // <--- FIX: Added missing field
    refreshProfile: () => void;     // <--- FIX: Added missing field
    login: (token: string) => void;
    logout: () => void;
    isModalOpen: boolean;
    modalView: ModalView;
    openModal: (view?: ModalView) => void;
    closeModal: () => void;
}
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [userAvatar, setUserAvatar] = useState<string | null>(null); // <--- New State
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<ModalView>('LOGIN');

    // Helper to fetch profile (avatar)
    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            if (res.data.avatarUrl) {
                // Ensure absolute URL if backend returns relative path
                const url = res.data.avatarUrl.startsWith('/') 
                    ? `${BASE_URL}${res.data.avatarUrl}`
                    : res.data.avatarUrl;
                setUserAvatar(url);
            }
        } catch (e) {
            console.log("Profile load failed (user might be offline or token expired)");
        }
    };

    useEffect(() => {
        if (token) {
            try {
                // Decode token manually to avoid external library dependency if simpler
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ sub: payload.sub, jti: payload.jti });
                
                // Fetch avatar immediately on load
                fetchProfile();
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsModalOpen(false);
        // Fetch profile immediately after login
        setTimeout(fetchProfile, 100); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setUserAvatar(null);
    };

    const openModal = (view: ModalView = 'LOGIN') => {
        setModalView(view);
        setIsModalOpen(true);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            isAuthenticated: !!token, 
            userAvatar,      // <--- Expose
            refreshProfile: fetchProfile, // <--- Expose
            login, 
            logout, 
            isModalOpen, 
            modalView,
            openModal, 
            closeModal: () => setIsModalOpen(false) 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
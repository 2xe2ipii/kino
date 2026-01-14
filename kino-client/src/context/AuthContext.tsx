import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface User {
    sub: string;
    email: string;
}

interface UserProfile {
    displayName: string;
    avatarUrl: string;
    bio: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    isAuthenticated: boolean;
    token: string | null;
    login: (token: string, username: string, shouldClose?: boolean) => void; // <--- UPDATED SIGNATURE
    logout: () => void;
    modalType: 'LOGIN' | 'REGISTER' | null;
    openModal: (type: 'LOGIN' | 'REGISTER') => void;
    closeModal: () => void;
    refreshProfile: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [modalType, setModalType] = useState<'LOGIN' | 'REGISTER' | null>(null);

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ sub: payload.sub, email: payload.email });
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                fetchProfile();
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setUserProfile(res.data);
        } catch (e) {
            console.error("Failed to fetch profile");
        }
    };

    // --- UPDATED LOGIN FUNCTION ---
    const login = (newToken: string, username: string, shouldClose = true) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser({ sub: username, email: '' });
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        fetchProfile();
        
        if (shouldClose) {
            closeModal();
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setUserProfile(null);
        delete api.defaults.headers.common['Authorization'];
    };

    const openModal = (type: 'LOGIN' | 'REGISTER') => setModalType(type);
    const closeModal = () => setModalType(null);

    return (
        <AuthContext.Provider value={{ 
            user, 
            userProfile, 
            isAuthenticated: !!user, 
            token, 
            login, 
            logout, 
            modalType, 
            openModal, 
            closeModal,
            refreshProfile: fetchProfile 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
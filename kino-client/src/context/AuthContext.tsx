import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface User {
    id: string;
    username: string;
    email: string;
}

interface UserProfile {
    displayName: string;
    avatarUrl: string;
    bio: string;
}

interface PendingGoogle {
    googleId: string;
    email: string;
    displayName: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    pendingGoogle: PendingGoogle | null;
    loginWithGoogle: (idToken: string) => Promise<void>;
    completeProfile: (username: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    modalType: 'LOGIN' | 'REGISTER' | null;
    openModal: (type: 'LOGIN' | 'REGISTER') => void;
    closeModal: () => void;
    userProfile: UserProfile | null;
    refreshProfile: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [pendingGoogle, setPendingGoogle] = useState<PendingGoogle | null>(null);
    const [modalType, setModalType] = useState<'LOGIN' | 'REGISTER' | null>(null);

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.sub,
                    username: payload.unique_name,
                    email: payload.email,
                });
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                fetchProfile();
            } catch {
                logout();
            }
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setUserProfile(res.data);
        } catch {
            console.error('Failed to fetch profile');
        }
    };

    const storeToken = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUser({
            id: payload.sub,
            username: payload.unique_name,
            email: payload.email,
        });
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        fetchProfile();
    };

    const loginWithGoogle = async (idToken: string): Promise<void> => {
        const res = await api.post('/auth/google', { idToken });
        if (res.data.isNewUser) {
            setPendingGoogle({
                googleId: res.data.googleId,
                email: res.data.email,
                displayName: res.data.displayName,
            });
        } else {
            storeToken(res.data.token);
            closeModal();
        }
    };

    const completeProfile = async (username: string): Promise<void> => {
        if (!pendingGoogle) return;
        const res = await api.post('/auth/complete-profile', {
            googleId: pendingGoogle.googleId,
            email: pendingGoogle.email,
            displayName: pendingGoogle.displayName,
            username,
        });
        storeToken(res.data.token);
        setPendingGoogle(null);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setUserProfile(null);
        setPendingGoogle(null);
        delete api.defaults.headers.common['Authorization'];
    };

    const openModal = (type: 'LOGIN' | 'REGISTER') => setModalType(type);
    const closeModal = () => setModalType(null);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            pendingGoogle,
            loginWithGoogle,
            completeProfile,
            logout,
            isAuthenticated: !!user,
            modalType,
            openModal,
            closeModal,
            userProfile,
            refreshProfile: fetchProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

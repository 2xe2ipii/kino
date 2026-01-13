import { createContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    sub: string;
    jti: string;
}

export type ModalView = 'LOGIN' | 'REGISTER';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    isModalOpen: boolean;
    modalView: ModalView; // Track which view to show
    openModal: (view?: ModalView) => void; // Allow passing view
    closeModal: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<ModalView>('LOGIN');

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ sub: payload.sub, jti: payload.jti });
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsModalOpen(false);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const openModal = (view: ModalView = 'LOGIN') => {
        setModalView(view);
        setIsModalOpen(true);
    };

    return (
        <AuthContext.Provider value={{ 
            user, token, isAuthenticated: !!token, login, logout, 
            isModalOpen, modalView,
            openModal, 
            closeModal: () => setIsModalOpen(false) 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
// Change this line:
import { createContext, useState, useEffect, type ReactNode } from 'react'; // Added 'type' keyword

// ... (Rest of the file remains exactly the same as the previous correct version)
interface User {
    sub: string;
    jti: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    return (
        <AuthContext.Provider value={{ 
            user, token, isAuthenticated: !!token, login, logout, 
            isModalOpen, 
            openModal: () => setIsModalOpen(true), 
            closeModal: () => setIsModalOpen(false) 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsAuthenticated(true); // 토큰 있으면 로그인 상태로 설정
        }
    }, []);

    const login = (userId, token) => {
        setIsAuthenticated(true);
        localStorage.setItem('userId', userId);
        localStorage.setItem('accessToken', token);
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('userId');
        localStorage.removeItem('accessToken');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
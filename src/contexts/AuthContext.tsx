import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';

interface User {
    id: number;
    username: string;
    role: string;
    Role?: string;
    tenantId: number | null;
    plan: string;
    agentlessEnabled?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }, []);

    // ── Global 401 / session-expired listener ──────────────────────────────
    // The apiFetch utility clears sessionStorage and navigates to
    // /login?reason=session_expired when it receives a 401.
    // This effect keeps React state in sync when that happens.
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' && e.newValue === null) {
                // Another tab or apiFetch cleared the token
                setToken(null);
                setUser(null);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ── Detect session_expired query param on mount ────────────────────────
    // When apiFetch redirects to /login?reason=session_expired, make sure
    // local state is also cleared (handles same-tab redirects).
    useEffect(() => {
        if (window.location.search.includes('reason=session_expired')) {
            setToken(null);
            setUser(null);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

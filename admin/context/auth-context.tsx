"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    email: string;
    username?: string;
    name?: string;
    bio?: string;
    avatarUrl?: string;
    role: 'USER' | 'ADMIN';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.role !== 'ADMIN') {
                // If user is logged in but not admin, logout
                await api.post('/auth/logout');
                setUser(null);
                return false;
            }
            setUser(res.data);
            return true;
        } catch (err) {
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const login = async (data: any) => {
        await api.post('/auth/login', data);
        const success = await checkUser();

        if (success) {
            router.push('/');
        } else {
            throw new Error("Login success, but failed to load profile or not an admin.");
        }
    };

    const register = async (data: any) => {
        // Axios handles proper Content-Type for FormData automatically
        await api.post('/auth/register', data);
        await checkUser(); // Refresh user state immediately
        router.push('/');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { console.error(e) }

        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

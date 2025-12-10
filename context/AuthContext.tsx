
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<void>;
    register: (data: any) => Promise<User>;
    updateUserProfile: (data: any) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'sb_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize user from localStorage to persist session on refresh
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(false);

    const login = async (email: string, password?: string) => {
        setIsLoading(true);
        try {
            const userData = await api.login(email, password);
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: any) => {
        setIsLoading(true);
        try {
            const userData = await api.register(data);
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            return userData;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserProfile = async (data: any) => {
        if (!user) return false;
        setIsLoading(true);
        try {
            const success = await api.updateProfile(user.id, data);
            if (success) {
                // Update local state partially
                const updatedUser = { ...user, ...data }; // Assuming data matches User structure loosely
                setUser(updatedUser);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }
            return success;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, updateUserProfile, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

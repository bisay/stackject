"use client";

import React from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Toaster position="top-center" richColors theme="dark" />
                {children}
            </AuthProvider>
        </ThemeProvider>
    );
}

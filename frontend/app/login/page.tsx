"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

function LoginContent() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    
    const message = searchParams.get('message');
    const returnUrl = searchParams.get('returnUrl');

    const router = require('next/navigation').useRouter();
    
    // Show message on mount
    useEffect(() => {
        if (message === 'login_required') {
            toast.info('Silakan login terlebih dahulu untuk mendownload file');
        }
    }, [message]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("🔵 Attempting Login for:", email);

        try {
            await login({ email, password });
            toast.success("Welcome back! 👋 Redirection initiated...");
            console.log("🟢 Login Successful in Component");

            // Check if there's a return URL (from download redirect)
            if (returnUrl) {
                // Redirect to the download URL
                const apiUrl = getApiUrl();
                window.location.href = `${apiUrl}${decodeURIComponent(returnUrl)}`;
                return;
            }

            // Force redirection to dashboard
            router.push('/dashboard');

            // Fallback if router fails (common in some Next.js edge cases with context)
            setTimeout(() => {
                if (window.location.pathname !== '/dashboard') {
                    window.location.href = '/dashboard';
                }
            }, 1000);

        } catch (err: any) {
            console.error("🔴 Login Failed Error Object:", err);

            let message = 'Login failed';

            if (err.response) {
                console.error("🔴 Backend Response Data:", err.response.data);
                message = err.response.data.message || err.response.statusText;
            } else if (err.request) {
                message = "Network Error: Cannot reach server.";
            } else {
                message = err.message || message;
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #2a2a40, #000)', padding: '1rem' }}>

            <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={20} /> Back to Home
            </Link>

            <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--glass-border)' }}>
                
                {/* Login Required Message */}
                {message === 'login_required' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: 'rgba(251, 146, 60, 0.15)',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        borderRadius: '10px',
                        color: '#fb923c'
                    }}>
                        <AlertCircle size={20} />
                        <div style={{ fontSize: '0.9rem' }}>
                            Silakan login untuk mendownload file
                        </div>
                    </div>
                )}
                
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img src="/logo.png" alt="Stackject" style={{ width: '64px', height: '64px', margin: '0 auto 1rem auto', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Enter your credentials to access your workspace.</p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email</label>
                    <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                        required
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {loading ? <Loader2 className="spin" /> : 'Log In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                    Don't have an account? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link>
                </p>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #2a2a40, #000)' }}>
                <Loader2 className="spin" size={32} style={{ color: 'var(--primary)' }} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

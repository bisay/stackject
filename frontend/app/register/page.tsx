"use client";
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('username', username);
            formData.append('password', password);
            if (avatar) {
                formData.append('avatar', avatar);
            }
            await register(formData);
            toast.success("Welcome aboard! 🚀");
        } catch (err: any) {
            const msg = err.response?.data?.message || "Registration failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, #2a2a40, #000)', padding: '1rem' }}>

            <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={20} /> Back to Home
            </Link>

            <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img src="/logo.png" alt="Stackject" style={{ width: '64px', height: '64px', margin: '0 auto 1rem auto', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Join Stackject</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Start building with your team today.</p>
                </div>

                <div>
                    {/* Avatar Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                overflow: 'hidden', cursor: 'pointer', position: 'relative',
                                border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setAvatar(e.target.files[0]);
                                        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                    }
                                }}
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            />
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Upload<br />Photo</span>
                            )}
                        </div>
                    </div>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Full Name</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Username</label>
                    <input
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                        required
                        minLength={3}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Unique handle for your profile URL.</p>
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
                        minLength={8}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {loading ? <Loader2 className="spin" /> : 'Create Account'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                    Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
                </p>
            </form>
        </div>
    );
}

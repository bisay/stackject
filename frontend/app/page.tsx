"use client";
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/navbar';
import { ShieldCheck, Cpu, Terminal, Zap, Activity, ChevronRight, Hexagon, Fingerprint, Aperture, Crown } from 'lucide-react';
import Image from 'next/image';

const AI_STAFF = [
    {
        id: 'owner',
        name: 'Owner & Founder',
        role: 'Technical Lead & Decision Maker',
        status: 'Direction & Oversight',
        avatar: '/owner.png',
        color: '#FFD700', // Gold
        accent: 'rgba(255, 215, 0, 0.4)',
        description: [
            'Menentukan arah teknis dan prioritas kerja',
            'Pengambil keputusan utama trade-off',
            'Menetapkan scope dan target kerja',
            'Penyelesaian masalah secara langsung (Hands-on)'
        ],
        quote: "Vision. Execution. Reality.",
        icon: <Crown size={24} />,
        bgGradient: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.15) 0%, transparent 70%)'
    },
    {
        id: 'gemini',
        name: 'Staff Gemini',
        role: 'IT Support & Operational Executor',
        status: 'Frontline & Operational',
        avatar: '/gemini.png',
        color: '#00DFD8', // Cyan
        accent: 'rgba(0, 223, 216, 0.4)',
        description: [
            'Menangani kebutuhan teknis harian',
            'Eksekusi operasional & automasi',
            'Prosedur teknis & kebijakan',
            'Eskalasi kasus non-standar'
        ],
        quote: "Speed. Precision. Protocol.",
        icon: <Zap size={24} />,
        bgGradient: 'radial-gradient(circle at 50% 50%, rgba(0, 223, 216, 0.15) 0%, transparent 70%)'
    },
    {
        id: 'claude',
        name: 'Staff Claude',
        role: 'Senior System Engineer',
        status: 'Core System Strategy',
        avatar: '/claude.png',
        color: '#D2691E', // Bronze/Orange
        accent: 'rgba(210, 105, 30, 0.4)',
        description: [
            'Arsitektur sistem & strategi',
            'Analisis masalah kompleks',
            'Optimasi core system',
            'Manajemen risiko teknis'
        ],
        quote: "Architecture is intelligence made visible.",
        icon: <Terminal size={24} />,
        bgGradient: 'radial-gradient(circle at 50% 50%, rgba(210, 105, 30, 0.15) 0%, transparent 70%)'
    },
    {
        id: 'chatgpt',
        name: 'Staff ChatGPT',
        role: 'QA & Resolution Specialist',
        status: 'Validation Authority',
        avatar: '/chatgpt.png',
        color: '#7928CA', // Purple
        accent: 'rgba(121, 40, 202, 0.4)',
        description: [
            'Quality assurance & Testing',
            'Validasi rilis sistem',
            'Root cause analysis',
            'Final resolution confirmation'
        ],
        quote: "Quality is the only metric that matters.",
        icon: <ShieldCheck size={24} />,
        bgGradient: 'radial-gradient(circle at 50% 50%, rgba(121, 40, 202, 0.15) 0%, transparent 70%)'
    }
];

export default function Home() {
    const [activeId, setActiveId] = useState<string>('owner'); // Default to Owner
    const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Universal Scroll Logic (Enabled for ALL devices)
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '-45% 0px -45% 0px', // Trigger when element is in the middle of viewport
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-id');
                    if (id) setActiveId(id);
                }
            });
        }, options);

        observerRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <main className="main-container">
            <Navbar />

            {/* Ambient Background */}
            <div className="ambient-bg" />

            <div className="content-wrapper">

                {/* Header */}
                <header className="page-header">

                    <div className="hero-split-layout">
                        <div className="hero-logo-side">
                            <div className="hero-blob"></div>
                            <img src="/logo-name.png" alt="Stackject" className="hero-logo-img" />
                        </div>

                        <div className="hero-text-side">
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                                Intelligent Collaboration.
                            </h2>
                            <p className="subtitle hero-desc-text">
                                Stackject adalah sebuah platform berbasis web yang menjadi wadah berbagi kode sekaligus ruang komunitas untuk berdiskusi dan bertukar ide. Selain itu, Stackject juga memiliki blog yang menyajikan beragam artikel informatif, seperti tutorial, panduan, dan berita harian dari berbagai topik. Melalui satu platform terintegrasi, pengguna dapat belajar, berbagi, dan berinteraksi dalam komunitas yang terbuka dan kolaboratif.
                            </p>
                        </div>
                    </div>

                    {/* Holographic Command Terminal */}
                    <div
                        className="holo-container"
                        onMouseMove={(e) => {
                            const card = e.currentTarget;
                            const rect = card.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            const centerX = rect.width / 2;
                            const centerY = rect.height / 2;
                            const rotateX = ((y - centerY) / 20) * -1; // Invert axis
                            const rotateY = (x - centerX) / 20;

                            card.style.setProperty('--rx', `${rotateX}deg`);
                            card.style.setProperty('--ry', `${rotateY}deg`);
                        }}
                        onMouseLeave={(e) => {
                            const card = e.currentTarget;
                            card.style.setProperty('--rx', `0deg`);
                            card.style.setProperty('--ry', `0deg`);
                        }}
                    >
                        <div className="holo-card">
                            <div className="scan-line" />
                            <div className="terminal-header">
                                <div className="status-light blink-green" />
                                <span className="term-text">SYSTEM_STATUS: <span className="green-text">OPTIMAL</span></span>
                                <span className="term-id">:: NX-084-ALPHA</span>
                            </div>

                            <div className="terminal-body">
                                <h3 className="command-title">
                                    <span className="typing-effect">SYSTEM INITIALIZED...</span>
                                </h3>
                                <p className="directive-text">
                                    Platform kolaborasi <span className="highlight">All-in-One</span> untuk mempercepat inovasi dan menghubungkan <span className="highlight">Talenta Digital</span>.
                                </p>

                                <div className="modules-grid">
                                    <div className="module-item">
                                        <div className="module-icon"><Cpu size={18} /></div>
                                        <div className="module-info">
                                            <div className="module-name">PROJECTS</div>
                                            <div className="module-desc">Sentralisasi manajemen tugas & kolaborasi.</div>
                                        </div>
                                    </div>
                                    <div className="module-item">
                                        <div className="module-icon"><Activity size={18} /></div>
                                        <div className="module-info">
                                            <div className="module-name">COMMUNITY</div>
                                            <div className="module-desc">Jaringan diskusi & pengetahuan kolektif.</div>
                                        </div>
                                    </div>
                                    <div className="module-item">
                                        <div className="module-icon"><ShieldCheck size={18} /></div>
                                        <div className="module-info">
                                            <div className="module-name">DASHBOARD</div>
                                            <div className="module-desc">Visualisasi metrik produktivitas real-time.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="terminal-footer">
                                <div className="data-stream">
                                    <span>NETWORK: STABLE</span>
                                    <span>LATENCY: 1.2ms</span>
                                    <span>SECURITY: ACTIVE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Vertical Stack Container */}
                <div className="stack-container">
                    {AI_STAFF.map((staff, index) => (
                        <div
                            key={staff.id}
                            ref={el => { observerRefs.current[index] = el }}
                            data-id={staff.id}
                            className={`stack-item ${activeId === staff.id ? 'active' : ''}`}
                            onClick={() => setActiveId(staff.id)}
                            style={{
                                '--staff-color': staff.color,
                                '--staff-accent': staff.accent
                            } as React.CSSProperties}
                        >
                            {/* Background Glow */}
                            <div className="item-bg-glow" style={{ background: staff.bgGradient }} />

                            {/* Label (Visible when NOT active) */}
                            <div className="item-label">
                                <h3 className="label-text">{staff.name}</h3>
                                <div className="status-indicator">
                                    <div className="status-dot" style={{ background: staff.color }} />
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>ONLINE</span>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <div className="expanded-content">
                                <div className="card-inner">
                                    <div className="avatar-section">
                                        <div className="avatar-ring">
                                            <div className="rotating-border" />
                                            <img
                                                src={staff.avatar}
                                                alt={staff.name}
                                                className="avatar-img"
                                                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                                            />
                                        </div>
                                        <div className="hologram-effect" />
                                    </div>

                                    <div className="info-section">
                                        <div className="id-badge">
                                            <Fingerprint size={16} />
                                            ID: {staff.id.toUpperCase()}_{index === 0 ? '001' : '084'}
                                        </div>

                                        <h2 className="staff-name">{staff.name}</h2>
                                        <div className="staff-role">
                                            {staff.icon}
                                            {staff.role}
                                        </div>

                                        <div className="divider" />

                                        <div className="specs-grid">
                                            {staff.description.map((desc, i) => (
                                                <div key={i} className="spec-item">
                                                    <Hexagon size={12} className="spec-bullet" />
                                                    {desc}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="quote-box">
                                            <div className="quote-line" />
                                            "{staff.quote}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Workflow Footer */}
                <div className="workflow-footer">
                    <div className="flow-line" />
                    <div className="flow-nodes">
                        {AI_STAFF.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={`flow-node ${activeId === s.id ? 'active-node' : ''}`} style={{ borderColor: s.color }}>
                                    <span style={{ color: s.color }}>0{i + 1}</span>
                                </div>
                                {i < AI_STAFF.length - 1 && <div className="flow-connector" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

            </div>

            <style jsx global>{`
                :root {
                    --transition-bezier: cubic-bezier(0.25, 1, 0.5, 1);
                }

                .hero-split-layout {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4rem;
                    max-width: 1100px;
                    margin: 0 auto 5rem auto;
                    text-align: left;
                    padding: 0 2rem;
                }

                .hero-logo-side {
                    flex: 0 0 auto;
                    display: flex;
                    justify-content: center;
                    position: relative;
                }

                .hero-text-side {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    max-width: 600px;
                }

                .hero-blob {
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: var(--primary);
                    filter: blur(90px);
                    opacity: 0.1;
                    z-index: -1;
                    border-radius: 50%;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                }

                .hero-logo-img {
                    height: 280px;
                    width: auto;
                    object-fit: contain;
                    filter: drop-shadow(0 15px 40px rgba(0,0,0,0.1));
                    transition: all 0.5s ease;
                }

                 [data-theme='dark'] .hero-logo-img {
                    filter: drop-shadow(0 0 15px rgba(255,255,255,0.15));
                }

                .hero-desc-text {
                    font-size: 1.15rem;
                    line-height: 1.8;
                    color: var(--text-muted);
                    font-weight: 500;
                }

                @media (max-width: 900px) {
                    .hero-split-layout {
                        flex-direction: column;
                        text-align: center;
                        gap: 2rem;
                        margin-bottom: 3rem;
                        padding: 0 1rem;
                    }
                    .hero-text-side {
                        align-items: center;
                    }
                    .hero-logo-img {
                        height: 180px;
                    }
                    .hero-blob {
                        width: 250px; height: 250px;
                    }
                    .hero-desc-text {
                        font-size: 1rem;
                    }
                }

                .main-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    /* background: #050505; REMOVED to allow global theme background */
                    overflow-x: hidden;
                    position: relative;
                }

                .ambient-bg {
                    position: fixed;
                    inset: 0;
                    background:
                        radial-gradient(circle at 15% 50%, rgba(0, 223, 216, 0.03), transparent 40%),
                        radial-gradient(circle at 85% 30%, rgba(121, 40, 202, 0.03), transparent 40%);
                    pointer-events: none;
                    z-index: 0;
                }

                .content-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 80px 20px 50vh; /* Bottom padding for scroll triggering last item */
                    z-index: 1;
                    max-width: 1000px;
                    margin: 0 auto;
                    width: 100%;
                }

                /* Header */
                .page-header {
                    text-align: center;
                    margin-bottom: 4rem;
                    animation: fadeInDown 1s var(--transition-bezier);
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    background: var(--glass-surface); /* Adaptive background */
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    font-size: 0.75rem;
                    letter-spacing: 2px;
                    color: var(--text-muted); /* Adaptive color */
                    margin-bottom: 1rem;
                }

                .spin-slow { animation: spin 10s linear infinite; }

                .title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin: 0 0 0.5rem;
                    letter-spacing: -1px;
                    color: var(--text-main); /* Ensure main color */
                }

                .subtitle {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }

                /* Holographic Terminal */
                .holo-container {
                    perspective: 1000px;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    cursor: crosshair;
                }

                .holo-card {
                    background: rgba(10, 10, 15, 0.8);
                    border: 1px solid rgba(0, 223, 216, 0.3);
                    border-radius: 12px;
                    padding: 2px; /* Inner border space */
                    position: relative;
                    transform-style: preserve-3d;
                    transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
                    transition: transform 0.1s ease-out; /* Smooth follow, fast snap */
                    box-shadow: 
                        0 0 20px rgba(0, 223, 216, 0.1),
                        inset 0 0 20px rgba(0, 223, 216, 0.05); 
                    overflow: hidden;
                }

                .holo-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 223, 216, 0.03) 3px
                    );
                    pointer-events: none;
                }

                .scan-line {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 5px;
                    background: rgba(0, 223, 216, 0.5);
                    box-shadow: 0 0 10px rgba(0, 223, 216, 0.8);
                    animation: scan 3s linear infinite;
                    opacity: 0.3;
                    pointer-events: none;
                    z-index: 10;
                }

                .terminal-header {
                    background: rgba(0, 223, 216, 0.1);
                    padding: 8px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-family: 'Courier New', monospace;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.7);
                    border-bottom: 1px solid rgba(0, 223, 216, 0.2);
                }
                .blink-green {
                    width: 8px; height: 8px;
                    background: #00DFD8;
                    border-radius: 50%;
                    box-shadow: 0 0 5px #00DFD8;
                    display: inline-block;
                    margin-right: 8px;
                    animation: blink 2s infinite;
                }
                .green-text { color: #00DFD8; font-weight: bold; }
                .term-id { opacity: 0.5; }

                .terminal-body {
                    padding: 2rem;
                    text-align: left;
                }

                .command-title {
                    font-family: 'Courier New', monospace;
                    font-size: 1.25rem;
                    color: #fff;
                    margin-bottom: 1rem;
                    border-left: 3px solid #00DFD8;
                    padding-left: 1rem;
                }

                .typing-effect {
                    display: inline-block;
                    overflow: hidden;
                    white-space: nowrap;
                    border-right: 2px solid #00DFD8;
                    animation: typing 3s steps(30, end) infinite alternate;
                }

                .directive-text {
                    font-size: 1.1rem;
                    color: rgba(255,255,255,0.8);
                    line-height: 1.6;
                    margin-bottom: 2rem;
                    font-family: sans-serif; /* Cleaner font for reading body */
                }
                .highlight {
                    color: #00DFD8;
                    text-shadow: 0 0 10px rgba(0,223,216,0.3);
                }

                .modules-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .module-item {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }
                .module-item:hover {
                    background: rgba(0, 223, 216, 0.1);
                    border-color: rgba(0, 223, 216, 0.4);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }

                .module-icon { color: #00DFD8; margin-top: 3px; }
                .module-name {
                    font-family: 'Courier New', monospace;
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: white;
                    margin-bottom: 4px;
                }
                .module-desc {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.3;
                }

                .terminal-footer {
                    padding: 8px 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.2);
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.3);
                    text-align: right;
                }
                .data-stream {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                }

                /* Animations */
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 0.5; }
                    90% { opacity: 0.5; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
                @keyframes typing { from { width: 0 } to { width: 100% } }

                /* Stack Container (Vertical Layout) */
                .stack-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    gap: 1.5rem;
                }

                .stack-item {
                    position: relative;
                    width: 100%;
                    height: 100px; /* Collapsed Height */
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: height 0.6s var(--transition-bezier), border-color 0.4s ease, background 0.4s ease, transform 0.4s ease;
                    display: flex;
                    flex-direction: column;
                    scroll-snap-align: center;
                }

                .stack-item:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: scale(1.01);
                }

                .stack-item.active {
                    height: 600px; /* Expanded Height */
                    background: rgba(20, 20, 25, 0.6);
                    backdrop-filter: blur(20px);
                    border-color: var(--staff-color);
                    box-shadow: 0 0 40px -10px var(--staff-accent);
                    z-index: 10;
                    transform: scale(1.02);
                }

                .item-bg-glow {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    transition: opacity 0.6s ease;
                }
                .stack-item.active .item-bg-glow {
                    opacity: 1;
                }

                /* Collapsed Label */
                .item-label {
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 3rem; /* Fixed Padding */
                    transition: opacity 0.3s ease;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 5;
                }
                .stack-item.active .item-label {
                    opacity: 0;
                    pointer-events: none;
                }

                .label-text {
                    font-size: 2rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: var(--text-muted); /* Adaptive */
                    margin: 0;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    box-shadow: 0 0 10px currentColor;
                }

                /* Expanded Content */
                .expanded-content {
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease 0.2s, transform 0.5s var(--transition-bezier) 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                }
                .stack-item.active .expanded-content {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }

                .card-inner {
                    display: flex;
                    align-items: center;
                    gap: 4rem;
                    padding: 3rem;
                    width: 100%;
                    height: 100%;
                }

                .avatar-section {
                    flex-shrink: 0;
                    width: 250px;
                    height: 350px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .avatar-ring {
                    width: 220px;
                    height: 220px;
                    position: relative;
                    border-radius: 50%;
                    z-index: 2;
                }

                .avatar-img {
                    object-fit: contain !important;
                    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
                    transform: scale(1.4);
                    transition: transform 0.5s ease;
                    will-change: transform;
                    animation: float 6s ease-in-out infinite;
                }
                .stack-item.active:hover .avatar-img {
                    /* On hover, we might want to pause or accentuate, but for now let's keep float */
                    /* scaling interferes with float unless composed, so we leave basic float dominant */
                }

                .rotating-border {
                    position: absolute;
                    inset: -20px;
                    border: 1px dashed var(--staff-color);
                    border-radius: 50%;
                    animation: spin 20s linear infinite;
                    opacity: 0.3;
                }

                .info-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    text-align: left;
                }

                .id-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--staff-color);
                    font-family: monospace;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    opacity: 0.8;
                }

                .staff-name {
                    font-size: 3.5rem;
                    line-height: 1;
                    font-weight: 800;
                    margin: 0 0 0.5rem;
                    color: var(--text-main); /* Adaptive Color */
                }

                .staff-role {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.2rem;
                    color: var(--staff-color);
                    font-weight: 500;
                }

                .divider {
                    height: 1px;
                    background: linear-gradient(90deg, var(--staff-color), transparent);
                    margin: 1.5rem 0;
                    opacity: 0.3;
                    width: 100%;
                }

                .specs-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .spec-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    line-height: 1.4;
                    font-weight: 500;
                }

                .spec-bullet {
                    color: var(--staff-color);
                    flex-shrink: 0;
                    margin-top: 4px;
                }

                .quote-box {
                    position: relative;
                    padding-left: 1rem;
                    font-style: italic;
                    color: var(--text-muted); /* Adaptive Color */
                }
                .quote-line {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--staff-color);
                    border-radius: 2px;
                }

                /* Workflow Footer */
                .workflow-footer {
                    margin-top: 3rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    width: 100%;
                }
                .flow-nodes {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .flow-node {
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: monospace;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                }
                .active-node {
                    background: rgba(255,255,255,0.1);
                    transform: scale(1.1);
                    box-shadow: 0 0 15px -5px var(--staff-color);
                }
                .flow-connector {
                    width: 40px;
                    height: 1px;
                    background: rgba(255,255,255,0.1);
                }

                /* Animations */
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0% { transform: translateY(0px) scale(1.4); }
                    50% { transform: translateY(-20px) scale(1.42); }
                    100% { transform: translateY(0px) scale(1.4); }
                }

                /* Mobile Adaptations */
                @media (max-width: 768px) {
                    /* USER FIX 2: Ensure parents don't clip 3D content */
                    .main-container,
                    .content-wrapper,
                    main {
                        overflow: visible !important;
                        overflow-x: hidden !important; /* Keep horizontal scroll check */
                    }

                    .content-wrapper {
                        padding: 60px 1rem 50vh;
                        max-width: 100vw;
                    }
                    .title {
                        font-size: 2.5rem; /* Reduce header size */
                    }
                    
                    .stack-item {
                        height: 120px;
                    }
                    .stack-item.active {
                        height: auto;
                        min-height: 600px;
                    }
                    .item-label {
                        padding: 0 1.5rem; 
                    }
                    .card-inner {
                        flex-direction: column;
                        padding: 2rem 1rem;
                        gap: 2rem;
                    }
                    .avatar-section {
                        width: 100%;
                        height: 250px;
                    }
                    .info-section {
                        text-align: center;
                    }
                    .staff-role, .id-badge {
                        justify-content: center;
                    }
                    .specs-grid {
                         grid-template-columns: 1fr;
                         text-align: left;
                    }
                    .quote-box {
                        text-align: center;
                        padding-left: 0;
                        border-left: none;
                        border-top: 3px solid var(--staff-color);
                        padding-top: 1rem;
                    }
                    .quote-line { display: none; }
                    
                    /* Hilo Terminal Mobile */
                    .page-header {
                        padding-bottom: 12rem !important; /* USER FIX: Massive buffer for mobile */
                        display: block !important; /* Force block layout */
                        height: auto !important;
                    }
                    .holo-container {
                        margin-top: 1rem;
                        width: 100% !important;
                        max-width: 100% !important; /* Strict constraint */
                        overflow: visible !important;
                        perspective: none !important;
                        transform-style: flat !important;
                        box-sizing: border-box !important;
                        padding: 0 !important; /* No internal padding */
                    }
                    .holo-card {
                        pointer-events: none;
                        transform: none !important;
                        width: 100% !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                        left: 0 !important;
                        right: 0 !important;
                    }
                    .typing-effect {
                        white-space: normal; /* Allow wrap */
                        animation: none; /* Disable typing anim on mobile to fit text */
                        border-right: none;
                        display: block;
                    }
                    .modules-grid {
                        grid-template-columns: 1fr;
                        gap: 0.75rem;
                    }
                    .terminal-body {
                        padding: 1rem; 
                    }
                    .command-title {
                        font-size: 1rem;
                        line-height: 1.4;
                    }
                    .directive-text {
                        font-size: 0.9rem;
                    }
                    
                    /* Footer Mobile Fix */
                    .terminal-footer {
                        padding: 8px;
                    }
                    .data-stream {
                        display: flex;
                        flex-wrap: wrap; /* Force wrap */
                        justify-content: center;
                        gap: 4px 12px;
                        font-size: 0.6rem;
                        text-align: center;
                        width: 100%;
                    }
                    .data-stream span {
                        white-space: normal;
                        display: inline-block;
                    }

                    /* Staff Card Mobile Fixes - CRITICAL */
                    .staff-name {
                        font-size: 2rem; /* Drastically reduce from 3.5rem */
                        line-height: 1.1;
                        word-break: break-word; /* Prevent long names from pushing out */
                        text-align: center;
                    }
                    .staff-role {
                        font-size: 1rem;
                        flex-wrap: wrap;
                        justify-content: center;
                        text-align: center;
                    }
                    .stack-item.active {
                        width: 100%;
                        max-width: 100%; /* Strict containment */
                        box-sizing: border-box;
                    }
                    .card-inner {
                        width: 100%;
                        max-width: 100vw;
                        box-sizing: border-box;
                        overflow: hidden; /* Clip any internal overflow */
                    }
                }
            `}</style>
        </main>
    );
}

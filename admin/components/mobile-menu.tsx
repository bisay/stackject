"use client";
import React, { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import Sidebar from './sidebar';

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mobile-only">
            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--brand-gradient)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        zIndex: 2000,
                        cursor: 'pointer'
                    }}
                >
                    <MoreHorizontal size={28} />
                </button>
            )}

            {/* Overlay / Drawer */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2001,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                }}>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                        }}
                    />

                    {/* Drawer Content */}
                    <div style={{
                        position: 'relative',
                        background: 'var(--bg-main)',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        borderTop: '1px solid var(--glass-border)',
                        padding: '16px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--glass-border)' }} />
                        </div>

                        {/* Reuse Sidebar Component - overriding styles via CSS or Wrapper? 
                            Sidebar has fixed width/height mostly. We need to override it.
                            The easiest way is to modify Sidebar to accept style props or use a wrapper that restricts it.
                            But Sidebar has 'height: 100vh', we need 'height: auto'.
                            
                            Let's check Sidebar code again. It uses inline styles heavily.
                            We might need to duplicate specific nav links here or refactor Sidebar.
                            Actually, reusing Sidebar is risky if it has fixed layout.
                            Better to Refactor Sidebar to be flexible OR just render the links here directly.
                            
                            Given the user wants "show hide" of the sidebar, let's try to reusing Sidebar but strip the container style.
                            Wait, I can just render Sidebar and override its style via a parent div if I convert Sidebar to use Classes or accept style prop.
                            
                            For now, let's just Re-implement the Nav Items here cleanly. It's safer than hacking the Sidebar component.
                        */}
                        <div style={{ paddingBottom: '24px' }}>
                            <Sidebar mobileMode={true} onClose={() => setIsOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
            <style jsx global>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

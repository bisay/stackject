"use client";
import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    confirmColor?: string;
}

export default function ConfirmModal({
    isOpen,
    title,
    description,
    onConfirm,
    onCancel,
    confirmText = "Delete",
    confirmColor = "red"
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}></div>

            <div className="glass-card" style={{
                position: 'relative',
                width: '400px',
                padding: '2rem',
                background: 'var(--bg-main)',
                border: '1px solid var(--glass-border)',
                textAlign: 'center'
            }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', marginTop: 0 }}>{title}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                    {description}
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-primary"
                        style={{ flex: 1, background: confirmColor === 'red' ? 'rgba(255,0,0,0.2)' : undefined, color: confirmColor === 'red' ? 'red' : undefined, border: confirmColor === 'red' ? '1px solid rgba(255,0,0,0.3)' : undefined }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

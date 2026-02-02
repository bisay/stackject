"use client";
import React from 'react';
import { Rocket, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project }: { project: any }) {
    if (!project) return null;

    return (
        <a
            href={`/c/${project.owner?.username || 'unknown'}/project/${project.slug}`}
            style={{ textDecoration: 'none', display: 'inline-block', margin: '10px 0', width: '100%' }}
        >
            <span className="glass-card" style={{ padding: '15px', display: 'flex', gap: '15px', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', width: '100%' }}>
                {project.imageUrl ? (
                    <span style={{ width: '60px', height: '60px', borderRadius: '10px', background: `url(${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${project.imageUrl}) center/cover`, display: 'block', flexShrink: 0 }}></span>
                ) : (
                    <span style={{ width: '60px', height: '60px', borderRadius: '10px', background: 'var(--glass-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Rocket size={24} color="var(--primary)" />
                    </span>
                )}

                <span style={{ flex: 1, display: 'block', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {project.name}
                        <ExternalLink size={14} color="var(--text-muted)" />
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {project.description || "No description provided."}
                    </span>
                </span>
            </span>
        </a>
    );
}

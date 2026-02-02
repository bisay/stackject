import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    metadataBase: new URL('https://stackject.com'), // Replace with actual domain when deployed
    title: {
        default: 'Stackject - Intelligent Collaboration & Project Management',
        template: '%s | Stackject'
    },
    description: 'Stackject is a modern project management and collaboration platform for software teams. Integrate code repositories, track tasks, and discuss in one ecosystem.',
    keywords: ['project management', 'collaboration', 'software development', 'developer tools', 'task tracking', 'code repository', 'indonesia', 'startup'],
    authors: [{ name: 'Stackject Team' }],
    creator: 'Stackject',
    publisher: 'Stackject',
    openGraph: {
        title: 'Stackject - Intelligent Collaboration',
        description: 'Where projects grow. The all-in-one platform for developers.',
        url: 'https://stackject.com',
        siteName: 'Stackject',
        images: [
            {
                url: '/logo-name.png', // Ensure this image is suitable for social sharing
                width: 1200,
                height: 630,
                alt: 'Stackject Platform',
            },
        ],
        locale: 'id_ID',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Stackject',
        description: 'Intelligent Collaboration for Developers.',
        images: ['/logo-name.png'],
        creator: '@stackject',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

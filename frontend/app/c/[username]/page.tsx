import { Metadata } from 'next';
import ProfileView from './view';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Function to fetch data for metadata
const getUser = async (username: string) => {
    try {
        const res = await fetch(`${API_URL}/users/${username}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Failed to fetch user for metadata", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    const user = await getUser(params.username);

    if (!user) {
        return {
            title: 'User not found | Stackject',
        };
    }

    // Resolve avatar URL to full path
    const avatarUrl = user.avatarUrl 
        ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_URL}${user.avatarUrl}`)
        : `${BASE_URL}/default-avatar.png`;
    
    const profileUrl = `${BASE_URL}/c/${user.username}`;
    const description = user.bio || `Check out ${user.name || user.username}'s profile on Stackject.`;

    return {
        title: `${user.name || user.username} (@${user.username}) • Stackject`,
        description: description,
        openGraph: {
            title: `${user.name || user.username} (@${user.username})`,
            description: description,
            type: 'profile',
            url: profileUrl,
            siteName: 'Stackject',
            images: [{
                url: avatarUrl,
                width: 400,
                height: 400,
                alt: `${user.username}'s profile picture`
            }],
        },
        twitter: {
            card: 'summary',
            title: `${user.name || user.username} (@${user.username})`,
            description: description,
            images: [avatarUrl],
            creator: `@${user.username}`,
        },
        alternates: {
            canonical: profileUrl,
        }
    };
}

export default function Page() {
    return <ProfileView />;
}

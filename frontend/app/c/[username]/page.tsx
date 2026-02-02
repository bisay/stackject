import { Metadata } from 'next';
import ProfileView from './view';

// Function to fetch data for metadata
const getUser = async (username: string) => {
    try {
        const res = await fetch(`http://localhost:3001/users/${username}`, { cache: 'no-store' }); // Assuming backend endpoint
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

    return {
        title: `${user.name} (@${user.username}) • Stackject`,
        description: `${user.bio || `Check out ${user.name}'s profile on Stackject.`}`,
        openGraph: {
            title: `${user.name} (@${user.username})`,
            description: user.bio || `Check out ${user.name}'s profile on Stackject.`,
            images: user.avatarUrl ? [user.avatarUrl] : [],
        },
        twitter: {
            card: 'summary',
            title: `${user.name} (@${user.username})`,
            description: user.bio || `Check out ${user.name}'s profile on Stackject.`,
            images: user.avatarUrl ? [user.avatarUrl] : [],
        }
    };
}

export default function Page() {
    return <ProfileView />;
}

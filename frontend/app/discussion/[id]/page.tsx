import { Metadata } from 'next';
import DiscussionView from './view';

// Function to fetch data for metadata
// We can't access context here, so we might need a direct backend call.
// Since we are in the same network, we can call the backend API URL.
// Assuming backend is at http://localhost:4000
const getDiscussion = async (id: string) => {
    try {
        const res = await fetch(`http://localhost:3001/discussions/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Failed to fetch discussion for metadata", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const discussion = await getDiscussion(params.id);

    if (!discussion) {
        return {
            title: 'Discussion not found | Stackject',
        };
    }

    // Clean content for description (remove markdown or html tags if possible, simple strip for now)
    const description = discussion.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...';

    return {
        title: `${discussion.author.name} on Stackject: "${discussion.title || 'Post'}"`,
        description: description,
        openGraph: {
            title: `${discussion.author.name} on Stackject`,
            description: description,
            type: 'article',
            images: discussion.author.avatarUrl ? [discussion.author.avatarUrl] : [],
        },
        twitter: {
            card: 'summary',
            title: `${discussion.author.name} on Stackject`,
            description: description,
            images: discussion.author.avatarUrl ? [discussion.author.avatarUrl] : [],
        }
    };
}

export default function Page() {
    return <DiscussionView />;
}

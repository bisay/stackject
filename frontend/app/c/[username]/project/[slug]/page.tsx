import { Metadata } from 'next';
import ProjectDetailView from './view';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Function to fetch data for metadata
const getProject = async (username: string, slug: string) => {
    try {
        const res = await fetch(`${API_URL}/projects/${username}/${slug}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Failed to fetch project for metadata", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { username: string, slug: string } }): Promise<Metadata> {
    const project = await getProject(params.username, params.slug);

    if (!project) {
        return {
            title: 'Project not found | Stackject',
        };
    }

    // Resolve image URL to full path
    const imageUrl = project.imageUrl 
        ? (project.imageUrl.startsWith('http') ? project.imageUrl : `${API_URL}${project.imageUrl}`)
        : `${BASE_URL}/og-default.png`;
    
    const projectUrl = `${BASE_URL}/c/${project.owner.username}/project/${project.slug}`;

    return {
        title: `${project.name} by @${project.owner.username} | Stackject`,
        description: project.description || `Check out ${project.name} on Stackject`,
        openGraph: {
            title: `${project.name} - Stackject`,
            description: project.description || `Check out ${project.name} on Stackject`,
            type: 'website',
            url: projectUrl,
            siteName: 'Stackject',
            images: [{
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: project.name
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${project.name} - Stackject`,
            description: project.description || `Check out ${project.name} on Stackject`,
            images: [imageUrl],
            creator: `@${project.owner.username}`,
        },
        alternates: {
            canonical: projectUrl,
        }
    };
}

export default function Page() {
    return <ProjectDetailView />;
}

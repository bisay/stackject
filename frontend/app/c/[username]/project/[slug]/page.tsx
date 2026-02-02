import { Metadata } from 'next';
import ProjectDetailView from './view';

// Function to fetch data for metadata
const getProject = async (username: string, slug: string) => {
    try {
        const res = await fetch(`http://localhost:3001/projects/${username}/${slug}`, { cache: 'no-store' }); // Updated port to 3001
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

    return {
        title: `${project.name} by @${project.owner.username} | Stackject`,
        description: project.description,
        openGraph: {
            title: `${project.name}`,
            description: project.description,
            type: 'website',
            images: project.imageUrl ? [project.imageUrl] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${project.name}`,
            description: project.description,
            images: project.imageUrl ? [project.imageUrl] : [],
        }
    };
}

export default function Page() {
    return <ProjectDetailView />;
}

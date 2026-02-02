"use client";
import { useParams } from 'next/navigation';
import SocialLayout from '@/components/social-layout';
import DiscussionDetail from '@/components/discussion-detail';

export default function DiscussionView() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    return (
        <SocialLayout>
            <DiscussionDetail discussionId={id} />
        </SocialLayout>
    );
}

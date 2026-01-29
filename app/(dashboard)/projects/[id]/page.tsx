'use client';

import { use } from 'react';
import ProjectEditor from '@/components/project/ProjectEditor';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <ProjectEditor projectId={id} isNew={false} />;
}

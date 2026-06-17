import type { Metadata } from 'next';
import ProjectDetailClient from './_client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/projects/${params.id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const project = data.project;
    const title = `${project.title} – AquaFolks Project`;
    const description =
      project.description?.slice(0, 155) ||
      `A ${project.project_type} project by ${project.user?.display_name || project.user?.username || 'an aquarist'} on AquaFolks.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: project.cover_photo_url ? [{ url: project.cover_photo_url }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: project.cover_photo_url ? [project.cover_photo_url] : [],
      },
    };
  } catch {
    return {
      title: 'Project – AquaFolks',
      description: 'Aquarium project on AquaFolks community.',
    };
  }
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailClient />;
}

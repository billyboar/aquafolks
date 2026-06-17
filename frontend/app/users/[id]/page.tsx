import type { Metadata } from 'next';
import UserProfileClient from './_client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/users/${params.id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const user = data.user;
    const displayName = user.display_name || user.username;
    const title = `${displayName} (@${user.username}) – AquaFolks`;
    const description =
      user.bio?.slice(0, 155) ||
      `${displayName}'s aquarium profile on AquaFolks community. See their tanks, projects, and more.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: user.avatar_url ? [{ url: user.avatar_url }] : [],
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: user.avatar_url ? [user.avatar_url] : [],
      },
    };
  } catch {
    return {
      title: 'User Profile – AquaFolks',
      description: 'Aquarist profile on AquaFolks community.',
    };
  }
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  return <UserProfileClient />;
}

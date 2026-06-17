import type { Metadata } from 'next';
import TankDetailClient from './_client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/tanks/${params.id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const tank = data.tank;
    const title = `${tank.name} – AquaFolks Tank`;
    const description =
      tank.description?.slice(0, 155) ||
      `A ${tank.tank_type} tank (${(tank.volume_liters / 3.78541).toFixed(0)} gal) on AquaFolks aquarium community.`;
    const primaryPhoto = tank.photos?.find((p: any) => p.is_primary) || tank.photos?.[0];
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: primaryPhoto ? [{ url: primaryPhoto.url }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: primaryPhoto ? [primaryPhoto.url] : [],
      },
    };
  } catch {
    return {
      title: 'Aquarium Tank – AquaFolks',
      description: 'Aquarium tank on AquaFolks community.',
    };
  }
}

export default function TankDetailPage({ params }: { params: { id: string } }) {
  return <TankDetailClient />;
}

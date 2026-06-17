import type { Metadata } from 'next';
import ListingDetailClient from './_client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings/${params.id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const listing = data.listing;
    const priceStr =
      listing.price_type === 'free'
        ? 'FREE'
        : listing.price
        ? `$${Number(listing.price).toFixed(2)}`
        : 'Negotiable';
    const title = `${listing.title} – ${priceStr} | AquaFolks Marketplace`;
    const description =
      listing.description?.slice(0, 155) ||
      `${listing.category} listing on AquaFolks aquarium marketplace.`;
    const primaryPhoto =
      listing.photos?.find((p: any) => p.is_primary) || listing.photos?.[0];
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: primaryPhoto ? [{ url: primaryPhoto.photo_url }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: primaryPhoto ? [primaryPhoto.photo_url] : [],
      },
    };
  } catch {
    return {
      title: 'Marketplace Listing – AquaFolks',
      description: 'Aquarium listing on AquaFolks marketplace.',
    };
  }
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return <ListingDetailClient />;
}

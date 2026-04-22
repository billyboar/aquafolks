import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

// GROQ queries
export const queries = {
  posts: `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    "author": author->{name, slug, image},
    "categories": categories[]->{ title, slug }
  }`,
  
  featuredPosts: `*[_type == "post" && featured == true] | order(publishedAt desc) [0...3] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    "author": author->{name, slug, image}
  }`,
  
  postBySlug: `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    body,
    "author": author->{name, slug, image, bio},
    "categories": categories[]->{ title, slug }
  }`,
  
  postSlugs: `*[_type == "post"] { "slug": slug.current }`,
};

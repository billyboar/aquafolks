import Link from 'next/link';
import Image from 'next/image';
import { PortableText } from '@portabletext/react';
import { client, queries, urlFor } from '@/lib/sanity';
import { notFound } from 'next/navigation';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImage: any;
  body: any;
  author: {
    name: string;
    slug: { current: string };
    image: any;
    bio: any;
  };
  categories: Array<{
    title: string;
    slug: { current: string };
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs: Array<{ slug: string }> = await client.fetch(queries.postSlugs);
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: Post = await client.fetch(queries.postBySlug, { slug });

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - AquaFolks Blog`,
    description: post.excerpt || '',
    openGraph: post.mainImage
      ? {
          images: [urlFor(post.mainImage).width(1200).height(630).url()],
        }
      : {},
  };
}

// Portable Text components for rich content
const components = {
  types: {
    image: ({ value }: any) => (
      <div className="my-8 rounded-lg overflow-hidden">
        <Image
          src={urlFor(value).width(800).url()}
          alt={value.alt || 'Blog image'}
          width={800}
          height={450}
          className="w-full h-auto"
        />
        {value.alt && (
          <p className="text-center text-sm text-gray-600 mt-2">{value.alt}</p>
        )}
      </div>
    ),
    code: ({ value }: any) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
        <code>{value.code}</code>
      </pre>
    ),
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold text-gray-900 mt-12 mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xl font-semibold text-gray-900 mt-6 mb-2">{children}</h4>
    ),
    normal: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-6 italic text-gray-700">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    code: ({ children }: any) => (
      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
        {children}
      </code>
    ),
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: Post = await client.fetch(queries.postBySlug, { slug });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      {post.mainImage && (
        <div className="w-full h-[400px] relative bg-gray-900">
          <Image
            src={urlFor(post.mainImage).width(1200).height(400).url()}
            alt={post.title}
            fill
            className="object-cover opacity-90"
            priority
          />
        </div>
      )}

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/blog" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Blog
        </Link>

        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((category) => (
              <span
                key={category.slug.current}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 pb-8 mb-8 border-b border-gray-200">
          {post.author && (
            <div className="flex items-center gap-3">
              {post.author.image && (
                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                  <Image
                    src={urlFor(post.author.image).width(48).height(48).url()}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <time className="text-sm text-gray-500" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <PortableText value={post.body} components={components} />
        </div>

        {/* Author Bio */}
        {post.author && post.author.bio && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">About the Author</h3>
            <div className="flex gap-4">
              {post.author.image && (
                <div className="w-20 h-20 rounded-full overflow-hidden relative flex-shrink-0">
                  <Image
                    src={urlFor(post.author.image).width(80).height(80).url()}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 text-lg mb-2">{post.author.name}</p>
                <div className="text-gray-600">
                  <PortableText value={post.author.bio} />
                </div>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* CTA */}
      <section className="bg-blue-50 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to join AquaFolks?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Share your own aquarium journey with our community
          </p>
          <a
            href="http://localhost:3001/register"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </section>
    </div>
  );
}

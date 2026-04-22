import Link from 'next/link';
import Image from 'next/image';
import { client, queries, urlFor } from '@/lib/sanity';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImage: any;
  author: {
    name: string;
    slug: { current: string };
    image: any;
  };
  categories: Array<{
    title: string;
    slug: { current: string };
  }>;
}

export const metadata = {
  title: 'Blog - AquaFolks',
  description: 'Explore articles about fishkeeping, aquascaping, and aquarium care',
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts: Post[] = await client.fetch(queries.posts);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Blog Posts</h1>
          <p className="text-gray-600">
            Insights and guides from the aquarium community
          </p>
        </div>
      </header>

      {/* Posts Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-600 mb-6">
              Posts will appear here once they are published.
            </p>
            <a
              href="/studio"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Post
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group"
              >
                <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  {post.mainImage && (
                    <div className="aspect-video relative bg-gray-100">
                      <Image
                        src={urlFor(post.mainImage).width(500).height(300).url()}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.slice(0, 2).map((category) => (
                          <span
                            key={category.slug.current}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                          >
                            {category.title}
                          </span>
                        ))}
                      </div>
                    )}

                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {post.author?.image && (
                          <div className="w-8 h-8 rounded-full overflow-hidden relative">
                            <Image
                              src={urlFor(post.author.image).width(32).height(32).url()}
                              alt={post.author.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{post.author?.name}</span>
                      </div>
                      <time className="text-sm text-gray-500" dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

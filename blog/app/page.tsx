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

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const featuredPosts: Post[] = await client.fetch(queries.featuredPosts);
  const recentPosts: Post[] = await client.fetch(queries.posts);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AquaFolks Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Insights, tips, and stories from the aquarium community. Learn about fishkeeping, 
            aquascaping, equipment reviews, and more.
          </p>
          <Link
            href="/blog"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Explore All Posts
          </Link>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Posts</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredPosts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group"
              >
                <article className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  {post.mainImage && (
                    <div className="aspect-video relative bg-gray-100">
                      <Image
                        src={urlFor(post.mainImage).width(600).height(400).url()}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <time dateTime={post.publishedAt}>
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
        </section>
      )}

      {/* Recent Posts */}
      <section className="max-w-6xl mx-auto px-4 py-16 bg-gray-50">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Recent Posts</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPosts.slice(0, 6).map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug.current}`}
              className="group"
            >
              <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {post.mainImage && (
                  <div className="aspect-video relative bg-gray-100">
                    <Image
                      src={urlFor(post.mainImage).width(400).height(300).url()}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                    {post.author && (
                      <span className="text-xs">{post.author.name}</span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="inline-block text-blue-600 font-medium hover:underline"
          >
            View all posts →
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start your aquarium journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the AquaFolks community to showcase your tanks, track your projects, 
            and connect with fellow aquarium enthusiasts.
          </p>
          <a
            href="http://localhost:3001/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Join AquaFolks
          </a>
        </div>
      </section>
    </div>
  );
}

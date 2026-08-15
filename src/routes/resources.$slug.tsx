import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import { posts } from "@/lib/data/news";

export const Route = createFileRoute("/resources/$slug")({
  head: ({ loaderData }) => {
    const data = loaderData as (typeof posts)[0] | undefined;
    return {
      meta: [
        { title: data?.title ? `${data.title} — SwiftArc News` : "Newsroom — SwiftArc" },
        { name: "description", content: data?.excerpt ?? "" },
      ],
    };
  },
  loader: async ({ params: { slug } }) => {
    const post = posts.find((p) => p.slug === slug);
    if (!post) throw notFound();
    return post;
  },
  component: FullArticle,
});

function FullArticle() {
  const post = Route.useLoaderData() as (typeof posts)[0];

  return (
    <article className="min-h-screen bg-background pb-20 pt-32 animate-in fade-in duration-500">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Newsroom
        </Link>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber">
            <Tag className="h-3 w-3" /> {post.tag}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {post.readTime}
          </span>
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-6 text-sm text-muted-foreground border-l-2 border-amber pl-4">
          {post.date} · By {post.author}
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-xl">
          <img src={post.img} alt={post.title} className="w-full object-cover" />
          <div className="bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground font-medium">
            Image: {post.imgCredit}
          </div>
        </div>

        <div className="mt-12 space-y-6 text-base md:text-lg text-foreground/80 leading-relaxed font-serif">
          {post.body.split("\n\n").map((para: string, i: number) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">Enjoyed this article?</p>
          <Link
            to="/resources"
            className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-6 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            Read more news
          </Link>
        </div>
      </div>
    </article>
  );
}

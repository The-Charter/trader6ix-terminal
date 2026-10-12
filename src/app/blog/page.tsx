import type { Metadata } from "next";
import { SiteLayout } from "@/components/trader6ix/site-layout";
import { BlogHero, BlogPosts } from "@/components/trader6ix/blog-sections";
import { CTA } from "@/components/trader6ix/sections";

export const metadata: Metadata = {
  title: "Blog And News — Trader6ix",
  description: "Trading insights, market trends and tutorials from the Trader6ix team.",
};

export default function BlogPage() {
  return (
    <SiteLayout>
      <main className="blogpage">
        <BlogHero />
        <BlogPosts />
        <div className="site-container">
          <CTA to="/auth" />
        </div>
      </main>
    </SiteLayout>
  );
}

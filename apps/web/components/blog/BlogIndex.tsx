'use client';

import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { BlogArticle, BlogCategory } from '../../lib/blog-content';
import { blogCategories, blogCategoryLabels } from '../../lib/blog-content';

const allCategoryId = 'all';

export function BlogIndex({ articles }: { articles: BlogArticle[] }) {
  const [activeCategory, setActiveCategory] = useState<typeof allCategoryId | BlogCategory>(allCategoryId);

  const featuredArticle = articles.find((article) => article.featured) ?? articles[0];
  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => activeCategory === allCategoryId || article.category === activeCategory),
    [activeCategory, articles],
  );

  return (
    <>
      <section id="articles" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="image-reflection relative min-h-[22rem] overflow-hidden">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">Featured article</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                {featuredArticle.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{featuredArticle.excerpt}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  {blogCategoryLabels[featuredArticle.category]}
                </span>
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  {featuredArticle.readTime}
                </span>
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  {featuredArticle.publishLabel}
                </span>
              </div>
              <Button href="/quote" className="mt-7">
                Demander un devis apres lecture
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card glass className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">Categories</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Filter education by topic.</h2>
            </div>
            <p className="text-sm font-bold text-slate-600">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} shown
            </p>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <CategoryButton
              label="All"
              active={activeCategory === allCategoryId}
              onClick={() => setActiveCategory(allCategoryId)}
            />
            {blogCategories.map((category) => (
              <CategoryButton
                key={category}
                label={blogCategoryLabels[category]}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              />
            ))}
          </div>
        </Card>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </>
  );
}

function CategoryButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 shrink-0 rounded-xl px-4 text-sm font-black transition ${
        active ? 'bg-deepblue text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-deepblue'
      }`}
    >
      {label}
    </button>
  );
}

function ArticleCard({ article }: { article: BlogArticle }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-glass">
      <div className="image-reflection relative overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-xl border border-white/[0.18] bg-white/[0.14] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl">
          {article.publishLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-signal">
          {blogCategoryLabels[article.category]}
        </p>
        <h3 className="mt-3 text-xl font-black tracking-tight text-ink">{article.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs font-black text-slate-500">{article.readTime}</span>
          <a href={`/blog/${article.slug}`} className="text-sm font-black text-deepblue transition hover:text-signal">
            Read guide
          </a>
        </div>
      </div>
    </Card>
  );
}

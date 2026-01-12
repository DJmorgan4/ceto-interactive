'use client';

import { useEffect, useState, useMemo } from 'react';

type FeedItem = {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  summary?: string;
  category?: string;
  impact?: 'high' | 'medium' | 'low';
  deadline?: string;
};

export default function EnvironmentalNews() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/updates', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as { items: FeedItem[] };
        if (!alive) return;
        setItems(data.items || []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load updates.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const categoryOk = categoryFilter === 'All' ? true : it.category === categoryFilter;
      const queryOk = q
        ? (it.title || '').toLowerCase().includes(q) ||
          (it.source || '').toLowerCase().includes(q) ||
          (it.summary || '').toLowerCase().includes(q)
        : true;
      return categoryOk && queryOk;
    });
  }, [items, query, categoryFilter]);

  const urgentItems = filtered.filter(i => i.impact === 'high' && i.deadline);
  const topStories = filtered.filter(i => i.impact === 'high' && !i.deadline).slice(0, 3);
  const regularItems = filtered.filter(i => i.impact !== 'high');

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      {/* Slim header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e6e9f2]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <a href="/" className="text-lg tracking-wide">
              <span className="font-semibold text-[#0b1220]">Ceto</span>
              <span className="font-light text-[#2b5fb8]">Interactive</span>
            </a>
            <nav className="flex items-center gap-6 text-sm">
              <a className="text-[#334155] hover:text-[#2b5fb8] transition" href="/">Home</a>
              <a className="text-[#334155] hover:text-[#2b5fb8] transition" href="/services">Services</a>
              <a className="text-[#2b5fb8] font-medium" href="/envnews">News</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Newspaper masthead */}
      <div className="bg-white border-b-4 border-[#0b1220]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
          <div className="text-center border-t-2 border-b-2 border-[#0b1220] py-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#64748b] mb-1">The</div>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#0b1220] mb-1">
              Environmental Register
            </h1>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#64748b] mb-2">
              Daily Intelligence on Environmental Law &amp; Regulation
            </div>
            <div className="text-xs text-[#475569]">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar - newspaper style */}
      <div className="bg-[#f0f4f8] border-b border-[#e6e9f2]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all updates..."
              className="flex-1 px-4 py-2 border border-[#e6e9f2] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5fb8]/30"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-[#e6e9f2] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5fb8]/30"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="text-xs text-[#64748b] flex items-center">
              {loading ? 'Updating...' : `${filtered.length} updates`}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-8 rounded-r-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-12">
            <div className="inline-block animate-pulse">
              <div className="text-lg font-medium text-[#0b1220]">Gathering latest updates...</div>
              <div className="text-sm text-[#64748b] mt-2">Monitoring EPA, TCEQ, USFWS & more</div>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#64748b]">No updates match your search. Try adjusting filters.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* URGENT SECTION - Red banner */}
            {urgentItems.length > 0 && (
              <section className="mb-10">
                <div className="bg-red-50 border-l-4 border-red-600 rounded-r-lg overflow-hidden">
                  <div className="bg-red-600 text-white px-6 py-3">
                    <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                      <span className="text-3xl">⚠</span>
                      Action Required
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    {urgentItems.map((item) => (
                      <article key={item.link} className="border-b border-red-200 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-serif text-xl font-bold text-[#0b1220] flex-1">
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="hover:text-[#2b5fb8] transition"
                            >
                              {item.title}
                            </a>
                          </h3>
                          {item.deadline && (
                            <div className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide rounded shrink-0">
                              {formatDate(item.deadline)}
                            </div>
                          )}
                        </div>
                        {item.summary && (
                          <p className="text-sm text-[#334155] mb-3 leading-relaxed">{item.summary}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-[#64748b]">
                          <span className="font-medium">{item.source}</span>
                          {item.publishedAt && (
                            <>
                              <span>•</span>
                              <span>{formatDate(item.publishedAt)}</span>
                            </>
                          )}
                          {item.category && (
                            <>
                              <span>•</span>
                              <span className="uppercase tracking-wide">{item.category}</span>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TOP STORIES - 3 column layout */}
            {topStories.length > 0 && (
              <section className="mb-10">
                <div className="border-b-2 border-[#0b1220] pb-2 mb-6">
                  <h2 className="font-serif text-3xl font-bold text-[#0b1220]">Top Stories</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {topStories.map((item) => (
                    <article key={item.link} className="bg-white border border-[#e6e9f2] rounded-lg p-5 hover:shadow-lg transition">
                      {item.category && (
                        <div className="mb-3">
                          <span className="text-[10px] uppercase tracking-wider bg-[#e6e9f2] text-[#334155] px-2 py-1 rounded">
                            {item.category}
                          </span>
                        </div>
                      )}
                      <h3 className="font-serif text-lg font-bold text-[#0b1220] mb-3 leading-tight">
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:text-[#2b5fb8] transition"
                        >
                          {item.title}
                        </a>
                      </h3>
                      {item.summary && (
                        <p className="text-sm text-[#475569] mb-3 leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-[#64748b] pt-3 border-t border-[#e6e9f2]">
                        <span className="font-medium">{item.source}</span>
                        {item.publishedAt && (
                          <>
                            <span>•</span>
                            <span>{formatDate(item.publishedAt)}</span>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* REGULAR UPDATES - Clean list */}
            {regularItems.length > 0 && (
              <section>
                <div className="border-b border-[#e6e9f2] pb-2 mb-4">
                  <h2 className="font-serif text-2xl font-bold text-[#0b1220]">Recent Updates</h2>
                </div>
                <div className="space-y-4">
                  {regularItems.map((item) => (
                    <article 
                      key={item.link}
                      className="bg-white border-l-4 border-[#2b5fb8] rounded-r-lg p-5 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {item.category && (
                            <div className="mb-2">
                              <span className="text-[10px] uppercase tracking-wider bg-[#e6e9f2] text-[#334155] px-2 py-1 rounded">
                                {item.category}
                              </span>
                            </div>
                          )}
                          <h3 className="font-serif text-lg font-bold text-[#0b1220] mb-2">
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="hover:text-[#2b5fb8] transition"
                            >
                              {item.title}
                            </a>
                          </h3>
                          {item.summary && (
                            <p className="text-sm text-[#475569] mb-3 leading-relaxed">
                              {item.summary}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-[#64748b]">
                            <span className="font-medium">{item.source}</span>
                            {item.publishedAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(item.publishedAt)}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-[#2b5fb8] font-medium hover:underline">
                              View Official Document →
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Call to action */}
        {!loading && !error && (
          <div className="mt-12 bg-[#0b1220] text-white rounded-lg p-8 text-center">
            <h3 className="font-serif text-2xl font-bold mb-2">Never Miss an Update</h3>
            <p className="text-sm text-gray-300 mb-4">
              Get weekly summaries of environmental regulations delivered to your inbox
            </p>
            <a 
              href="/contact"
              className="inline-block bg-[#2b5fb8] hover:bg-[#234f98] text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Subscribe for Free →
            </a>
          </div>
        )}
      </div>

      {/* Footer - Source credits */}
      <footer className="bg-white border-t border-[#e6e9f2] mt-12 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-serif italic text-sm text-[#475569] mb-2">
              "Your authoritative source for environmental regulatory intelligence"
            </p>
            <p className="text-xs text-[#64748b]">
              Monitored Sources: EPA, TCEQ, USFWS, USACE, NOAA, State Environmental Agencies
            </p>
            <div className="mt-4 flex justify-center gap-6 text-xs text-[#64748b]">
              <a href="/about" className="hover:text-[#2b5fb8]">About</a>
              <a href="/sources" className="hover:text-[#2b5fb8]">Sources</a>
              <a href="/archive" className="hover:text-[#2b5fb8]">Archive</a>
              <a href="/contact" className="hover:text-[#2b5fb8]">Suggest a Source</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return iso;
  }
}

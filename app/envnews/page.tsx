'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';

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
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const categoryOk = categoryFilter === 'All' ? true : it.category === categoryFilter;
      const queryOk = q ? (it.title || '').toLowerCase().includes(q) || (it.source || '').toLowerCase().includes(q) || (it.summary || '').toLowerCase().includes(q) : true;
      return categoryOk && queryOk;
    });
  }, [items, query, categoryFilter]);

  const urgentItems = filtered.filter(i => i.impact === 'high' && i.deadline);
  const topStories = filtered.filter(i => i.impact === 'high' && !i.deadline).slice(0, 1);
  const secondTier = filtered.filter(i => i.impact === 'high' && !i.deadline).slice(1, 3);
  const regularItems = filtered.filter(i => i.impact !== 'high');

  return (
    <main className="min-h-screen bg-white">
      {/* Top info bar - like WSJ */}
      <div className="border-b border-gray-300">
        <div className="max-w-[1400px] mx-auto px-8 py-2">
          <div className="flex items-center justify-between text-[11px] text-gray-600">
            <div className="tracking-wide">McKinney, Texas</div>
            <div className="tracking-wide">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Masthead - Fortune 500 clean */}
      <header className="border-b-4 border-black bg-white">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6">
              <Image 
                src="/logo.png" 
                alt="Ceto Interactive" 
                width={200}
                height={80}
                className="mx-auto"
                priority
              />
            </div>

            {/* Main title */}
            <h1 className="font-serif text-[72px] font-bold text-black mb-1 tracking-tight leading-none">
              CETO INTERACTIVE
            </h1>
            
            {/* Subtitle */}
            <div className="text-[15px] font-semibold text-black tracking-[0.15em] mb-4">
              ENVIRONMENTAL INTELLIGENCE
            </div>

            {/* Issue info */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-gray-600 tracking-wide">
              <span>VOL. 1</span>
              <span>•</span>
              <span>NO. {Math.floor((Date.now() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24 * 7))}</span>
              <span>•</span>
              <span className="font-semibold text-black">{items.length} REPORTS</span>
            </div>
          </div>
        </div>

        {/* Navigation bar */}
        <div className="border-t border-gray-300 bg-white">
          <div className="max-w-[1400px] mx-auto px-8 py-3">
            <div className="flex items-center justify-between">
              <nav className="flex gap-8 text-[13px] font-semibold">
                <a href="/" className="hover:text-gray-600 transition">HOME</a>
                <a href="/services" className="hover:text-gray-600 transition">SERVICES</a>
                <span className="text-black">LATEST UPDATES</span>
              </nav>
              <div className="text-[11px] text-gray-600 tracking-wide">
                UPDATED WEEKLY
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex gap-4 max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports..."
              className="flex-1 px-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black transition"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black transition bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {error && (
          <div className="border-4 border-red-600 bg-red-50 p-8 mb-12 text-center">
            <div className="text-xl font-bold text-red-900 mb-2">SERVICE INTERRUPTION</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-24">
            <div className="text-2xl font-serif font-bold text-black mb-4">Loading Intelligence...</div>
            <div className="text-sm text-gray-600">Monitoring EPA • TCEQ • USFWS • Federal Register</div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-xl text-gray-600">No reports match your search.</div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* URGENT - Banner */}
            {urgentItems.length > 0 && (
              <section className="mb-16 border-t-4 border-red-600 pt-8">
                <div className="mb-8">
                  <h2 className="text-[11px] font-bold tracking-[0.2em] text-red-600 mb-2">URGENT</h2>
                  <div className="text-3xl font-serif font-bold text-black">Action Required</div>
                </div>
                
                <div className="space-y-8">
                  {urgentItems.map((item) => (
                    <article key={item.link} className="border-l-4 border-red-600 pl-6">
                      <div className="flex items-start justify-between gap-8 mb-3">
                        <h3 className="text-2xl font-serif font-bold text-black leading-tight flex-1">
                          <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-gray-600 transition">
                            {item.title}
                          </a>
                        </h3>
                        {item.deadline && (
                          <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold tracking-wider shrink-0">
                            {formatDate(item.deadline)}
                          </div>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-[15px] leading-relaxed text-gray-700 mb-4">{item.summary}</p>
                      )}
                      <div className="flex gap-4 text-[11px] text-gray-600">
                        <span className="font-semibold text-black">{item.source}</span>
                        {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                        {item.category && <span>{item.category}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* TOP STORY - Full width feature */}
            {topStories.length > 0 && (
              <section className="mb-16 border-t-4 border-black pt-8">
                {topStories.map((item) => (
                  <article key={item.link}>
                    {item.category && (
                      <div className="text-[11px] font-bold tracking-[0.2em] text-black mb-3">{item.category}</div>
                    )}
                    <h2 className="text-5xl font-serif font-bold text-black leading-tight mb-6">
                      <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-gray-600 transition">
                        {item.title}
                      </a>
                    </h2>
                    {item.summary && (
                      <p className="text-xl leading-relaxed text-gray-700 mb-6 max-w-4xl">{item.summary}</p>
                    )}
                    <div className="flex gap-4 text-[11px] text-gray-600 pb-8 border-b border-gray-300">
                      <span className="font-semibold text-black">{item.source}</span>
                      {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {/* SECOND TIER - 2 column */}
            {secondTier.length > 0 && (
              <section className="mb-16">
                <div className="grid md:grid-cols-2 gap-12">
                  {secondTier.map((item) => (
                    <article key={item.link} className="border-t-2 border-black pt-6">
                      {item.category && (
                        <div className="text-[11px] font-bold tracking-[0.2em] text-black mb-3">{item.category}</div>
                      )}
                      <h3 className="text-2xl font-serif font-bold text-black leading-tight mb-4">
                        <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-gray-600 transition">
                          {item.title}
                        </a>
                      </h3>
                      {item.summary && (
                        <p className="text-[15px] leading-relaxed text-gray-700 mb-4">{item.summary}</p>
                      )}
                      <div className="flex gap-4 text-[11px] text-gray-600">
                        <span className="font-semibold text-black">{item.source}</span>
                        {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* REGULAR - 3 column compact */}
            {regularItems.length > 0 && (
              <section className="border-t border-gray-300 pt-8">
                <div className="grid md:grid-cols-3 gap-8">
                  {regularItems.map((item) => (
                    <article key={item.link} className="border-l border-gray-300 pl-4">
                      {item.category && (
                        <div className="text-[10px] font-bold tracking-wider text-black mb-2">{item.category}</div>
                      )}
                      <h4 className="text-lg font-serif font-bold text-black leading-tight mb-3">
                        <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-gray-600 transition">
                          {item.title}
                        </a>
                      </h4>
                      {item.summary && (
                        <p className="text-[13px] leading-relaxed text-gray-700 mb-3">{item.summary}</p>
                      )}
                      <div className="text-[10px] text-gray-600">
                        <span className="font-semibold text-black">{item.source}</span>
                        {item.publishedAt && <> • {formatDate(item.publishedAt)}</>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        {!loading && !error && (
          <div className="mt-20 border-4 border-black p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-black mb-4">Subscribe to Weekly Intelligence</h3>
              <p className="text-[15px] text-gray-700 mb-8 leading-relaxed">
                Receive curated environmental regulatory updates, compliance deadlines, and industry analysis delivered to your inbox every week.
              </p>
              <a href="/contact" className="inline-block bg-black text-white px-8 py-3 text-sm font-bold tracking-wider hover:bg-gray-800 transition">
                SUBSCRIBE NOW →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white py-12 mt-20">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <div className="mb-6">
            <div className="text-2xl font-serif font-bold text-black mb-2">CETO INTERACTIVE</div>
            <div className="text-[13px] text-gray-600 tracking-wide">Environmental Technology & Consulting</div>
          </div>
          <div className="text-[11px] text-gray-600 mb-6">
            Sources: EPA • TCEQ • USFWS • USACE • Federal Register • State Environmental Agencies
          </div>
          <div className="flex justify-center gap-8 text-[11px] font-semibold text-black mb-6">
            <a href="/about" className="hover:text-gray-600">ABOUT</a>
            <a href="/services" className="hover:text-gray-600">SERVICES</a>
            <a href="/contact" className="hover:text-gray-600">CONTACT</a>
          </div>
          <div className="text-[10px] text-gray-500">
            © 2026 Ceto Interactive. All reports sourced from official government publications.
          </div>
        </div>
      </footer>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch {
    return iso;
  }
}

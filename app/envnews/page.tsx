'use client';

import { useEffect, useMemo, useState } from 'react';

type FeedItem = {
  title: string;
  link: string;
  source: string; // e.g. "EPA", "TCEQ"
  publishedAt?: string; // ISO string (best-effort)
};

export default function EnvironmentalNews() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'EPA' | 'TCEQ'>('All');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const sourceOk = sourceFilter === 'All' ? true : it.source === sourceFilter;
      const queryOk = q
        ? (it.title || '').toLowerCase().includes(q) || (it.source || '').toLowerCase().includes(q)
        : true;
      return sourceOk && queryOk;
    });
  }, [items, query, sourceFilter]);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e6e9f2]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-xl sm:text-2xl tracking-wide">
              <span className="font-semibold text-[#0b1220]">Ceto</span>
              <span className="font-light text-[#2b5fb8]">Interactive</span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a className="text-[#334155] hover:text-[#2b5fb8] transition" href="/">
                Home
              </a>
              <a className="text-[#334155] hover:text-[#2b5fb8] transition" href="/services">
                Services
              </a>
              <a className="text-[#2b5fb8] font-medium" href="/envnews">
                News &amp; Updates
              </a>
              <a
                className="inline-flex items-center rounded-full bg-[#2b5fb8] text-white px-5 py-2 hover:bg-[#234f98] transition shadow-sm"
                href="/contact"
              >
                Connect
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(43,95,184,0.12), transparent 55%), radial-gradient(circle at 80% 35%, rgba(28,140,114,0.10), transparent 55%), radial-gradient(circle at 50% 90%, rgba(217,119,6,0.08), transparent 60%)"
          }}
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.28em] uppercase text-[#2b5fb8]/80">
              Environmental Intelligence
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-light leading-tight text-[#0b1220]">
              News &amp; Updates you can actually use.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">
              Pulled from official sources (starting with EPA + TCEQ). We’ll keep expanding as we wire in more feeds.
            </p>

            {/* Controls */}
            <div className="mt-6 grid sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="sr-only" htmlFor="q">
                  Search
                </label>
                <input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search updates…"
                  className="w-full rounded-2xl border border-[#e6e9f2] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2b5fb8]/30"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="sr-only" htmlFor="source">
                  Source
                </label>
                <select
                  id="source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="w-full rounded-2xl border border-[#e6e9f2] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2b5fb8]/30"
                >
                  <option>All</option>
                  <option>EPA</option>
                  <option>TCEQ</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <a
                  href="/contact"
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-[#0b1220] text-white px-4 py-3 text-sm hover:bg-black transition"
                >
                  Get notified
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-14">
        <div className="bg-white rounded-3xl border border-[#e6e9f2] shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-[#e6e9f2] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-medium text-[#0b1220]">Latest</h2>
              <p className="text-sm text-[#64748b] mt-1">
                Clean summaries, direct links, and a growing set of sources.
              </p>
            </div>

            <div className="text-xs text-[#64748b]">
              {loading ? 'Updating…' : `${filtered.length} item(s)`}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="rounded-2xl border border-[#fee2e2] bg-[#fff1f2] p-4 text-sm text-[#9f1239]">
                {error}
              </div>
            )}

            {loading && !error && (
              <div className="text-sm text-[#64748b]">Loading official updates…</div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="text-sm text-[#64748b]">
                No matches. Try a different search or switch sources.
              </div>
            )}

            <div className="mt-4 space-y-3">
              {filtered.map((it) => (
                <a
                  key={`${it.source}-${it.link}`}
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-2xl border border-[#e6e9f2] bg-[#fafbff] p-5 hover:bg-white hover:shadow-md transition"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                        it.source === 'EPA'
                          ? 'bg-[#eef6ff] text-[#234f98] border-[#dbeafe]'
                          : 'bg-[#ecfdf5] text-[#0f766e] border-[#d1fae5]'
                      }`}
                    >
                      {it.source}
                    </span>

                    {it.publishedAt && (
                      <span className="text-xs text-[#64748b]">
                        {formatDate(it.publishedAt)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-[#0b1220] group-hover:text-[#2b5fb8] transition">
                    {it.title}
                  </h3>

                  <p className="mt-2 text-sm text-[#64748b]">
                    Open source link →
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Soft CTA */}
        <div className="mt-8 text-center text-sm text-[#64748b]">
          Want a source added (TPWD, USFWS, NOAA, local municipalities)?{' '}
          <a className="text-[#2b5fb8] hover:text-[#234f98] underline" href="/contact">
            Tell us what you want tracked.
          </a>
        </div>
      </section>
    </main>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}


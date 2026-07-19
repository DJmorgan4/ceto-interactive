'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Opportunity = {
  id: string | number;
  table: string;
  title: string;
  organization: string;
  location: string;
  status: string;
  score: number;
  evidence_score: number | null;
  summary: string;
  source_url: string;
  astra_recommendation?: string | null;
  astra_win_probability?: string | number | null;
  astra_first_move?: string | null;
  fit_reason?: string | null;
  deadline?: string | null;
  budget?: string | null;
  opportunity_type?: string | null;
  source_type?: string | null;
  next_action?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  date_found?: string | null;
  last_checked?: string | null;
  raw?: Record<string, unknown> | null;
};

type Health = {
  status: string;
  database_exists?: boolean;
  database_mode?: string;
  opportunity_count?: number;
  python?: string;
};

type ChatMessage = {
  role: 'user' | 'atlas';
  text: string;
};

type DoctorCheck = {
  name: string;
  status: string;
  value?: unknown;
  detail?: string;
};

type SortKey =
  | 'score-desc'
  | 'score-asc'
  | 'deadline-asc'
  | 'win-desc'
  | 'newest';

const THEME = {
  bg: '#F4F7FA',
  surface: 'rgba(255,255,255,0.80)',
  surfaceStrong: 'rgba(255,255,255,0.97)',
  border: 'rgba(20,35,55,0.13)',
  ink: '#142337',
  muted: 'rgba(20,35,55,0.56)',
  blue: '#2F5D8C',
  blueDark: '#234B74',
  green: '#4F7A6A',
  orange: '#D97745',
  red: '#B83232',
  gold: '#B98125',
};

const VERDICTS = ['ALL', 'BID', 'WATCH', 'TEAM', 'NO_BID'] as const;

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value: unknown) {
  return String(value ?? '').trim();
}

function deadlineValue(item: Opportunity) {
  const value = item.deadline ?? item.raw?.deadline;
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateFoundValue(item: Opportunity) {
  const value = item.date_found ?? item.raw?.date_found;
  if (!value) return 0;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function daysUntil(date: Date | null) {
  if (!date) return null;
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.ceil((date.getTime() - start.getTime()) / 86_400_000);
}

function formatDate(date: Date | null) {
  if (!date) return 'Not listed';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function scoreColor(score: number) {
  if (score >= 80) return THEME.green;
  if (score >= 65) return THEME.blue;
  return THEME.orange;
}

function verdictColor(rec?: string | null) {
  const verdict = normalize(rec).toUpperCase();
  if (verdict === 'BID') return THEME.green;
  if (verdict === 'TEAM') return THEME.gold;
  if (verdict === 'NO_BID') return THEME.red;
  if (verdict === 'WATCH') return THEME.blue;
  return 'rgba(20,35,55,0.42)';
}

function safeText(value: unknown, fallback = 'Not listed') {
  const text = normalize(value);
  return text || fallback;
}

function uniqueValues(
  items: Opportunity[],
  selector: (item: Opportunity) => string,
) {
  return Array.from(
    new Set(items.map(selector).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export default function AtlasPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [doctorChecks, setDoctorChecks] = useState<DoctorCheck[]>([]);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'opportunities' | 'saved' | 'doctor'
  >('dashboard');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'atlas',
      text:
        'Atlas is online. Ask for Texas opportunities, deadlines, BID recommendations, teaming targets, or your strongest next move.',
    },
  ]);

  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [minimumScore, setMinimumScore] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('score-desc');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hideExpired, setHideExpired] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('atlas-saved-opportunities');
      if (stored) setSavedIds(JSON.parse(stored));
    } catch {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'atlas-saved-opportunities',
      JSON.stringify(savedIds),
    );
  }, [savedIds]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [healthResponse, opportunitiesResponse] =
        await Promise.all([
          fetch('/api/portal/atlas/health', {
            cache: 'no-store',
          }),
          fetch('/api/portal/atlas/opportunities?limit=500', {
            cache: 'no-store',
          }),
        ]);

      if (!healthResponse.ok) {
        throw new Error('Atlas health check failed.');
      }

      if (!opportunitiesResponse.ok) {
        throw new Error('Atlas opportunities could not be loaded.');
      }

      const healthPayload = await healthResponse.json();
      const data = await opportunitiesResponse.json();
      const items: Opportunity[] = data.items ?? [];

      setHealth(healthPayload);
      setOpportunities(items);

      setSelected(current => {
        if (current) {
          return (
            items.find(
              item =>
                String(item.id) === String(current.id) &&
                item.table === current.table,
            ) ?? items[0] ?? null
          );
        }
        return items[0] ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Atlas could not be reached.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDoctor = useCallback(async () => {
    try {
      const response = await fetch('/api/portal/atlas/doctor', {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const payload = await response.json();
      setDoctorChecks(payload?.data?.checks ?? []);
    } catch {
      setDoctorChecks([]);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadDoctor();
  }, [loadData, loadDoctor]);

  const locations = useMemo(
    () =>
      uniqueValues(opportunities, item =>
        safeText(item.location, ''),
      ),
    [opportunities],
  );

  const sources = useMemo(
    () =>
      uniqueValues(opportunities, item =>
        safeText(
          item.source_type ?? item.raw?.source_type ?? item.table,
          '',
        ),
      ),
    [opportunities],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const result = opportunities.filter(item => {
      const itemVerdict = normalize(
        item.astra_recommendation,
      ).toUpperCase();
      const location = safeText(item.location, '');
      const source = safeText(
        item.source_type ?? item.raw?.source_type ?? item.table,
        '',
      );
      const deadline = deadlineValue(item);
      const remaining = daysUntil(deadline);

      const haystack = [
        item.title,
        item.organization,
        item.location,
        item.summary,
        item.fit_reason,
        item.astra_first_move,
        item.opportunity_type,
        item.source_type,
      ]
        .map(value => normalize(value).toLowerCase())
        .join(' ');

      return (
        (!needle || haystack.includes(needle)) &&
        (verdict === 'ALL' || itemVerdict === verdict) &&
        (locationFilter === 'ALL' ||
          location === locationFilter) &&
        (sourceFilter === 'ALL' || source === sourceFilter) &&
        numberValue(item.score) >= minimumScore &&
        (!hideExpired || remaining === null || remaining >= 0)
      );
    });

    return [...result].sort((a, b) => {
      if (sortKey === 'score-asc') {
        return numberValue(a.score) - numberValue(b.score);
      }
      if (sortKey === 'deadline-asc') {
        const aDate = deadlineValue(a)?.getTime() ?? Infinity;
        const bDate = deadlineValue(b)?.getTime() ?? Infinity;
        return aDate - bDate;
      }
      if (sortKey === 'win-desc') {
        return (
          numberValue(b.astra_win_probability) -
          numberValue(a.astra_win_probability)
        );
      }
      if (sortKey === 'newest') {
        return dateFoundValue(b) - dateFoundValue(a);
      }
      return numberValue(b.score) - numberValue(a.score);
    });
  }, [
    opportunities,
    query,
    verdict,
    locationFilter,
    sourceFilter,
    minimumScore,
    hideExpired,
    sortKey,
  ]);

  const saved = useMemo(
    () =>
      filtered.filter(item =>
        savedIds.includes(`${item.table}:${item.id}`),
      ),
    [filtered, savedIds],
  );

  const visible =
    activeTab === 'saved' ? saved : filtered;

  const metrics = useMemo(() => {
    const bids = opportunities.filter(
      item =>
        normalize(item.astra_recommendation).toUpperCase() ===
        'BID',
    ).length;
    const team = opportunities.filter(
      item =>
        normalize(item.astra_recommendation).toUpperCase() ===
        'TEAM',
    ).length;
    const urgent = opportunities.filter(item => {
      const remaining = daysUntil(deadlineValue(item));
      return remaining !== null && remaining >= 0 && remaining <= 14;
    }).length;
    const average = opportunities.length
      ? opportunities.reduce(
          (sum, item) => sum + numberValue(item.score),
          0,
        ) / opportunities.length
      : 0;

    return {
      total: opportunities.length,
      bids,
      team,
      urgent,
      average,
    };
  }, [opportunities]);

  function toggleSaved(item: Opportunity) {
    const key = `${item.table}:${item.id}`;
    setSavedIds(current =>
      current.includes(key)
        ? current.filter(id => id !== key)
        : [...current, key],
    );
  }

  function resetFilters() {
    setQuery('');
    setVerdict('ALL');
    setLocationFilter('ALL');
    setSourceFilter('ALL');
    setMinimumScore(0);
    setHideExpired(true);
    setSortKey('score-desc');
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setMessages(current => [
      ...current,
      { role: 'user', text: message },
    ]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/portal/atlas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      setMessages(current => [
        ...current,
        {
          role: 'atlas',
          text:
            data.answer ??
            data.error ??
            'Atlas did not return a response.',
        },
      ]);

      for (const action of data.actions ?? []) {
        if (action.type === 'select_opportunity') {
          const match = opportunities.find(
            item => String(item.id) === String(action.id),
          );
          if (match) setSelected(match);
        }

        if (
          action.type === 'open_tab' &&
          ['dashboard', 'opportunities', 'saved', 'doctor'].includes(
            action.tab,
          )
        ) {
          setActiveTab(action.tab);
        }
      }
    } catch {
      setMessages(current => [
        ...current,
        {
          role: 'atlas',
          text:
            'Atlas could not be reached. Check the Railway service and ATLAS_API_URL.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function runAtlas() {
    setRunning(true);

    try {
      const response = await fetch('/api/portal/atlas/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direct_limit: 10,
          signal_limit: 10,
        }),
      });

      const data = await response.json();

      setMessages(current => [
        ...current,
        {
          role: 'atlas',
          text: data.success
            ? 'Atlas completed the scan. Your opportunity feed has been refreshed.'
            : `Atlas completed with a warning: ${
                data.output ?? data.error ?? 'No output was returned.'
              }`,
        },
      ]);

      await loadData();
      await loadDoctor();
    } finally {
      setRunning(false);
    }
  }

  const selectedDeadline = selected
    ? deadlineValue(selected)
    : null;
  const selectedRemaining = daysUntil(selectedDeadline);
  const selectedSaved = selected
    ? savedIds.includes(`${selected.table}:${selected.id}`)
    : false;

  return (
    <main
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: THEME.bg, color: THEME.ink }}
    >
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <a
              href="/portal"
              className="text-xs"
              style={{ color: THEME.blue }}
            >
              ← Ceto Portal
            </a>
            <p
              className="mt-3 text-xs uppercase tracking-[0.24em]"
              style={{ color: THEME.blue }}
            >
              Personal Work Intelligence
            </p>
            <h1 className="mt-1 text-3xl font-light md:text-4xl">
              Atlas Opportunity Command Center
            </h1>
            <p
              className="mt-2 max-w-3xl text-sm"
              style={{ color: THEME.muted }}
            >
              Find work, compare fit, track deadlines, save targets,
              and turn the strongest opportunities into a clear next
              action.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs"
              style={{
                backgroundColor: THEME.surfaceStrong,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    health?.status === 'healthy'
                      ? '#38A169'
                      : '#E0A12D',
                }}
              />
              {health?.status === 'healthy'
                ? `Atlas online · ${health.database_mode ?? 'database'}`
                : 'Connecting'}
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="rounded-full px-5 py-2 text-xs"
              style={{
                border: `1px solid ${THEME.border}`,
                backgroundColor: THEME.surfaceStrong,
              }}
            >
              Ask Atlas
            </button>

            <button
              type="button"
              onClick={runAtlas}
              disabled={running}
              className="rounded-full px-5 py-2 text-xs text-white disabled:opacity-50"
              style={{ backgroundColor: THEME.blue }}
            >
              {running ? 'Scanning…' : 'Run Atlas'}
            </button>
          </div>
        </header>

        {error && (
          <div
            className="mb-5 flex items-center justify-between rounded-2xl p-4 text-sm"
            style={{
              border: `1px solid rgba(184,50,50,0.24)`,
              backgroundColor: 'rgba(184,50,50,0.06)',
            }}
          >
            <span>{error}</span>
            <button type="button" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        <nav
          className="mb-5 flex flex-wrap gap-2 rounded-2xl p-2"
          style={{
            backgroundColor: THEME.surface,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {[
            ['dashboard', 'Dashboard'],
            ['opportunities', `All opportunities (${filtered.length})`],
            ['saved', `Saved (${savedIds.length})`],
            ['doctor', 'System'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveTab(value as typeof activeTab)
              }
              className="rounded-xl px-4 py-2 text-sm"
              style={{
                backgroundColor:
                  activeTab === value ? THEME.blue : 'transparent',
                color:
                  activeTab === value ? 'white' : THEME.ink,
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <section
          className="mb-5 rounded-3xl p-4"
          style={{
            backgroundColor: THEME.surfaceStrong,
            border: `1px solid ${THEME.border}`,
          }}
        >
          <div className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)_auto]">
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search title, agency, location, service, or keyword…"
              className="rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                border: `1px solid ${THEME.border}`,
                backgroundColor: 'rgba(20,35,55,0.03)',
              }}
            />

            <select
              value={verdict}
              onChange={event => setVerdict(event.target.value)}
              className="rounded-xl px-3 py-3 text-sm"
              style={{ border: `1px solid ${THEME.border}` }}
            >
              {VERDICTS.map(value => (
                <option key={value} value={value}>
                  {value === 'ALL' ? 'All verdicts' : value}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={event =>
                setLocationFilter(event.target.value)
              }
              className="rounded-xl px-3 py-3 text-sm"
              style={{ border: `1px solid ${THEME.border}` }}
            >
              <option value="ALL">All locations</option>
              {locations.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={event =>
                setSourceFilter(event.target.value)
              }
              className="rounded-xl px-3 py-3 text-sm"
              style={{ border: `1px solid ${THEME.border}` }}
            >
              <option value="ALL">All sources</option>
              {sources.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={event =>
                setSortKey(event.target.value as SortKey)
              }
              className="rounded-xl px-3 py-3 text-sm"
              style={{ border: `1px solid ${THEME.border}` }}
            >
              <option value="score-desc">Highest score</option>
              <option value="win-desc">Highest win chance</option>
              <option value="deadline-asc">Nearest deadline</option>
              <option value="newest">Newest found</option>
              <option value="score-asc">Lowest score</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                border: `1px solid ${THEME.border}`,
                backgroundColor: THEME.surfaceStrong,
              }}
            >
              Reset
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs">
            <label className="flex items-center gap-2">
              <span>Minimum score</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minimumScore}
                onChange={event =>
                  setMinimumScore(Number(event.target.value))
                }
              />
              <strong>{minimumScore}</strong>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hideExpired}
                onChange={event =>
                  setHideExpired(event.target.checked)
                }
              />
              Hide expired deadlines
            </label>
          </div>
        </section>

        {activeTab === 'dashboard' && (
          <>
            <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ['Total opportunities', metrics.total],
                ['BID targets', metrics.bids],
                ['Teaming targets', metrics.team],
                ['Due in 14 days', metrics.urgent],
                [
                  'Average score',
                  metrics.average
                    ? metrics.average.toFixed(1)
                    : '—',
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: THEME.surfaceStrong,
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: THEME.muted }}
                  >
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-light">
                    {value}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-5 2xl:grid-cols-[1.35fr_0.65fr]">
              <OpportunityTable
                items={filtered.slice(0, 12)}
                loading={loading}
                selected={selected}
                savedIds={savedIds}
                onSelect={setSelected}
                onToggleSaved={toggleSaved}
                onViewAll={() =>
                  setActiveTab('opportunities')
                }
              />

              <OpportunityDetail
                item={selected}
                saved={selectedSaved}
                deadline={selectedDeadline}
                daysRemaining={selectedRemaining}
                onToggleSaved={() =>
                  selected && toggleSaved(selected)
                }
              />
            </section>
          </>
        )}

        {(activeTab === 'opportunities' ||
          activeTab === 'saved') && (
          <section className="grid gap-5 2xl:grid-cols-[1.35fr_0.65fr]">
            <OpportunityTable
              items={visible}
              loading={loading}
              selected={selected}
              savedIds={savedIds}
              onSelect={setSelected}
              onToggleSaved={toggleSaved}
            />

            <OpportunityDetail
              item={selected}
              saved={selectedSaved}
              deadline={selectedDeadline}
              daysRemaining={selectedRemaining}
              onToggleSaved={() =>
                selected && toggleSaved(selected)
              }
            />
          </section>
        )}

        {activeTab === 'doctor' && (
          <section
            className="rounded-3xl p-5"
            style={{
              backgroundColor: THEME.surfaceStrong,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-light">
                  Atlas System
                </h2>
                <p
                  className="text-xs"
                  style={{ color: THEME.muted }}
                >
                  Agents, models, database, dependencies, reports,
                  and Git.
                </p>
              </div>
              <button
                type="button"
                onClick={loadDoctor}
                className="rounded-full px-4 py-2 text-xs text-white"
                style={{ backgroundColor: THEME.blue }}
              >
                Refresh
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {doctorChecks.map(check => (
                <div
                  key={check.name}
                  className="rounded-2xl p-4"
                  style={{
                    border: `1px solid ${THEME.border}`,
                    backgroundColor: 'rgba(255,255,255,0.55)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm">{check.name}</p>
                    <span
                      className="rounded-full px-2 py-1 text-[10px] uppercase"
                      style={{
                        color:
                          check.status === 'ok'
                            ? THEME.green
                            : check.status === 'fail'
                              ? THEME.red
                              : THEME.orange,
                        backgroundColor: 'rgba(20,35,55,0.04)',
                      }}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    {String(check.value ?? '—')}
                  </p>
                  {check.detail && (
                    <p
                      className="mt-1 text-xs"
                      style={{ color: THEME.muted }}
                    >
                      {check.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <button
        type="button"
        onClick={() => setChatOpen(current => !current)}
        className="fixed bottom-5 right-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full text-4xl shadow-xl transition hover:-translate-y-1"
        style={{
          border: `1px solid rgba(47,93,140,0.28)`,
          backgroundColor: 'rgba(245,250,253,0.98)',
        }}
        aria-label="Open Atlas chat"
      >
        🐘
      </button>

      {chatOpen && (
        <aside
          className="fixed bottom-24 right-4 z-[9998] flex h-[620px] w-[calc(100vw-32px)] max-w-[460px] flex-col overflow-hidden rounded-3xl shadow-2xl md:right-6"
          style={{
            backgroundColor: THEME.surfaceStrong,
            border: `1px solid ${THEME.border}`,
            backdropFilter: 'blur(18px)',
          }}
        >
          <header
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${THEME.border}` }}
          >
            <div>
              <p className="text-sm">Atlas Assistant</p>
              <p
                className="text-[11px]"
                style={{ color: THEME.muted }}
              >
                Personal opportunity intelligence
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="text-xl"
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="flex flex-wrap gap-2 border-b p-3">
            {[
              'Show BID opportunities',
              'What is due soon?',
              'Best Texas opportunity',
              'Where should I team?',
            ].map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => setChatInput(prompt)}
                className="rounded-full px-3 py-1.5 text-[11px]"
                style={{
                  border: `1px solid ${THEME.border}`,
                  backgroundColor: 'rgba(47,93,140,0.05)',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto text-white'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    message.role === 'user'
                      ? THEME.blue
                      : 'rgba(47,93,140,0.08)',
                }}
              >
                {message.text}
              </div>
            ))}

            {chatLoading && (
              <div
                className="w-fit rounded-2xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: 'rgba(47,93,140,0.08)',
                }}
              >
                Atlas is thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 p-4"
            style={{ borderTop: `1px solid ${THEME.border}` }}
          >
            <input
              value={chatInput}
              onChange={event => setChatInput(event.target.value)}
              placeholder="Ask Atlas about work…"
              className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: 'rgba(20,35,55,0.04)',
                border: `1px solid ${THEME.border}`,
              }}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="rounded-xl px-4 py-3 text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: THEME.blue }}
            >
              Ask
            </button>
          </form>
        </aside>
      )}
    </main>
  );
}

function OpportunityTable({
  items,
  loading,
  selected,
  savedIds,
  onSelect,
  onToggleSaved,
  onViewAll,
}: {
  items: Opportunity[];
  loading: boolean;
  selected: Opportunity | null;
  savedIds: string[];
  onSelect: (item: Opportunity) => void;
  onToggleSaved: (item: Opportunity) => void;
  onViewAll?: () => void;
}) {
  return (
    <section
      className="overflow-hidden rounded-3xl"
      style={{
        backgroundColor: THEME.surfaceStrong,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${THEME.border}` }}
      >
        <div>
          <h2 className="text-lg font-light">
            Opportunity pipeline
          </h2>
          <p className="text-xs" style={{ color: THEME.muted }}>
            Click a row for the full decision brief.
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs"
            style={{ color: THEME.blue }}
          >
            View all →
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead>
            <tr style={{ color: THEME.muted }}>
              <th className="px-4 py-3 font-normal">Save</th>
              <th className="px-4 py-3 font-normal">Score</th>
              <th className="px-4 py-3 font-normal">Verdict</th>
              <th className="px-4 py-3 font-normal">
                Opportunity
              </th>
              <th className="px-4 py-3 font-normal">
                Organization
              </th>
              <th className="px-4 py-3 font-normal">
                Location
              </th>
              <th className="px-4 py-3 font-normal">
                Deadline
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map(item => {
              const key = `${item.table}:${item.id}`;
              const isSaved = savedIds.includes(key);
              const isSelected =
                selected &&
                String(selected.id) === String(item.id) &&
                selected.table === item.table;
              const deadline = deadlineValue(item);
              const remaining = daysUntil(deadline);

              return (
                <tr
                  key={key}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer transition hover:bg-slate-50"
                  style={{
                    borderTop: `1px solid ${THEME.border}`,
                    backgroundColor: isSelected
                      ? 'rgba(47,93,140,0.06)'
                      : undefined,
                  }}
                >
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        onToggleSaved(item);
                      }}
                      className="text-lg"
                      aria-label={
                        isSaved ? 'Remove saved item' : 'Save item'
                      }
                    >
                      {isSaved ? '★' : '☆'}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className="rounded-full px-3 py-1 text-xs text-white"
                      style={{
                        backgroundColor: scoreColor(
                          numberValue(item.score),
                        ),
                      }}
                    >
                      {Math.round(numberValue(item.score))}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className="rounded-full px-3 py-1 text-xs text-white"
                      style={{
                        backgroundColor: verdictColor(
                          item.astra_recommendation,
                        ),
                      }}
                    >
                      {safeText(
                        item.astra_recommendation,
                        'UNRATED',
                      )}
                      {item.astra_win_probability
                        ? ` ${item.astra_win_probability}%`
                        : ''}
                    </span>
                  </td>

                  <td className="max-w-[360px] px-4 py-4">
                    <p className="line-clamp-2 font-medium">
                      {item.title}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: THEME.muted }}
                    >
                      {safeText(
                        item.opportunity_type ??
                          item.raw?.opportunity_type ??
                          item.source_type ??
                          item.table,
                      )}
                    </p>
                  </td>

                  <td className="max-w-[260px] px-4 py-4">
                    <p className="line-clamp-2">
                      {item.organization}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    {safeText(item.location)}
                  </td>

                  <td className="px-4 py-4">
                    <p>{formatDate(deadline)}</p>
                    {remaining !== null && (
                      <p
                        className="mt-1 text-xs"
                        style={{
                          color:
                            remaining < 0
                              ? THEME.red
                              : remaining <= 14
                                ? THEME.orange
                                : THEME.muted,
                        }}
                      >
                        {remaining < 0
                          ? 'Expired'
                          : remaining === 0
                            ? 'Due today'
                            : `${remaining} days left`}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && !items.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm"
                  style={{ color: THEME.muted }}
                >
                  No opportunities match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OpportunityDetail({
  item,
  saved,
  deadline,
  daysRemaining,
  onToggleSaved,
}: {
  item: Opportunity | null;
  saved: boolean;
  deadline: Date | null;
  daysRemaining: number | null;
  onToggleSaved: () => void;
}) {
  if (!item) {
    return (
      <aside
        className="rounded-3xl p-6"
        style={{
          backgroundColor: THEME.surfaceStrong,
          border: `1px solid ${THEME.border}`,
        }}
      >
        Select an opportunity to inspect it.
      </aside>
    );
  }

  const budget = safeText(
    item.budget ?? item.raw?.budget,
    'Not listed',
  );
  const type = safeText(
    item.opportunity_type ??
      item.raw?.opportunity_type ??
      item.source_type ??
      item.table,
  );
  const nextAction = safeText(
    item.next_action ?? item.raw?.next_action,
    item.astra_first_move || 'Review the source and confirm fit.',
  );

  return (
    <aside
      className="self-start rounded-3xl p-5 2xl:sticky 2xl:top-5"
      style={{
        backgroundColor: THEME.surfaceStrong,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: THEME.muted }}
          >
            Decision brief
          </p>
          <h2 className="mt-2 text-xl font-light leading-snug">
            {item.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onToggleSaved}
          className="rounded-full px-3 py-2 text-lg"
          style={{
            border: `1px solid ${THEME.border}`,
          }}
          aria-label={saved ? 'Remove saved item' : 'Save item'}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs text-white"
          style={{
            backgroundColor: scoreColor(numberValue(item.score)),
          }}
        >
          Score {Math.round(numberValue(item.score))}
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs text-white"
          style={{
            backgroundColor: verdictColor(
              item.astra_recommendation,
            ),
          }}
        >
          {safeText(item.astra_recommendation, 'UNRATED')}
          {item.astra_win_probability
            ? ` · ${item.astra_win_probability}% win`
            : ''}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
        <DetailField
          label="Organization"
          value={item.organization}
        />
        <DetailField label="Location" value={item.location} />
        <DetailField label="Type" value={type} />
        <DetailField label="Budget" value={budget} />
        <DetailField
          label="Deadline"
          value={formatDate(deadline)}
          note={
            daysRemaining === null
              ? undefined
              : daysRemaining < 0
                ? 'Expired'
                : `${daysRemaining} days remaining`
          }
        />
        <DetailField
          label="Source"
          value={safeText(
            item.source_type ?? item.raw?.source_type ?? item.table,
          )}
        />
      </dl>

      <div
        className="mt-5 rounded-2xl p-4"
        style={{
          backgroundColor: 'rgba(47,93,140,0.06)',
          border: `1px solid ${THEME.border}`,
        }}
      >
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: THEME.muted }}
        >
          Best next action
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {nextAction}
        </p>
      </div>

      {item.fit_reason && (
        <DetailSection
          title="Why it fits"
          text={item.fit_reason}
        />
      )}

      {item.summary && (
        <DetailSection title="Opportunity summary" text={item.summary} />
      )}

      {item.astra_first_move &&
        item.astra_first_move !== nextAction && (
          <DetailSection
            title="ASTRA first move"
            text={item.astra_first_move}
          />
        )}

      <div className="mt-6 flex flex-wrap gap-2">
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl px-4 py-3 text-sm text-white"
            style={{ backgroundColor: THEME.blue }}
          >
            Open source ↗
          </a>
        )}

        {item.contact_email && (
          <a
            href={`mailto:${item.contact_email}`}
            className="rounded-xl px-4 py-3 text-sm"
            style={{ border: `1px solid ${THEME.border}` }}
          >
            Email contact
          </a>
        )}
      </div>
    </aside>
  );
}

function DetailField({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wider"
        style={{ color: THEME.muted }}
      >
        {label}
      </dt>
      <dd className="mt-1">{safeText(value)}</dd>
      {note && (
        <p
          className="mt-1 text-xs"
          style={{ color: THEME.orange }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function DetailSection({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="mt-5">
      <p
        className="text-xs uppercase tracking-wider"
        style={{ color: THEME.muted }}
      >
        {title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {text}
      </p>
    </div>
  );
}

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
};

type Health = {
  status: string;
  database_exists: boolean;
  opportunity_count: number;
  python: string;
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

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.78)',
  surfaceStrong: 'rgba(255,255,255,0.94)',
  border: 'rgba(20,35,55,0.14)',
  ink: '#142337',
  blue: '#2F5D8C',
  blueDark: '#234B74',
  green: '#4F7A6A',
  orange: '#E07A5F',
};

const CITY_POSITIONS: Record<
  string,
  { left: string; top: string }
> = {
  dallas: { left: '58%', top: '29%' },
  mckinney: { left: '61%', top: '22%' },
  'fort worth': { left: '52%', top: '31%' },
  austin: { left: '50%', top: '56%' },
  houston: { left: '70%', top: '64%' },
  galveston: { left: '75%', top: '72%' },
  'sugar land': { left: '67%', top: '67%' },
  'san antonio': { left: '43%', top: '69%' },
  decatur: { left: '50%', top: '26%' },
};

function markerPosition(location: string, index: number) {
  const lowered = location.toLowerCase();

  for (const [city, position] of Object.entries(
    CITY_POSITIONS,
  )) {
    if (lowered.includes(city)) {
      return position;
    }
  }

  const fallback = [
    { left: '42%', top: '42%' },
    { left: '63%', top: '46%' },
    { left: '55%', top: '66%' },
    { left: '35%', top: '58%' },
  ];

  return fallback[index % fallback.length];
}

function scoreColor(score: number) {
  if (score >= 80) return THEME.green;
  if (score >= 65) return THEME.blue;
  return THEME.orange;
}

export default function AtlasPage() {
  const [health, setHealth] = useState<Health | null>(
    null,
  );
  const [opportunities, setOpportunities] = useState<
    Opportunity[]
  >([]);
  const [doctorChecks, setDoctorChecks] = useState<
    DoctorCheck[]
  >([]);
  const [selected, setSelected] =
    useState<Opportunity | null>(null);
  const [activeTab, setActiveTab] = useState<
    'command' | 'opportunities' | 'doctor'
  >('command');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] =
    useState(false);
  const [mascotState, setMascotState] = useState<
    'idle' | 'thinking' | 'celebrate' | 'point'
  >('idle');
  const [messages, setMessages] = useState<
    ChatMessage[]
  >([
    {
      role: 'atlas',
      text:
        'Good afternoon. I am Atlas. Ask me about opportunities, Texas locations, business scores, or system health.',
    },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [healthResponse, opportunitiesResponse] =
        await Promise.all([
          fetch('/api/portal/atlas/health', {
            cache: 'no-store',
          }),
          fetch('/api/portal/atlas/opportunities?limit=100', {
            cache: 'no-store',
          }),
        ]);

      if (healthResponse.ok) {
        setHealth(await healthResponse.json());
      }

      if (opportunitiesResponse.ok) {
        const data = await opportunitiesResponse.json();
        setOpportunities(data.items ?? []);

        if (!selected && data.items?.length) {
          setSelected(data.items[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const loadDoctor = useCallback(async () => {
    const response = await fetch(
      '/api/portal/atlas/doctor',
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) return;

    const payload = await response.json();

    setDoctorChecks(
      payload?.data?.checks ?? [],
    );
  }, []);

  useEffect(() => {
    loadData();
    loadDoctor();
  }, [loadData, loadDoctor]);

  const averageScore = useMemo(() => {
    if (!opportunities.length) return 0;

    return (
      opportunities.reduce(
        (sum, item) => sum + Number(item.score || 0),
        0,
      ) / opportunities.length
    );
  }, [opportunities]);

  const signalCount = opportunities.filter(
    item =>
      item.table.toLowerCase().includes('signal'),
  ).length;

  const directCount =
    opportunities.length - signalCount;

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || chatLoading) return;

    setMessages(current => [
      ...current,
      {
        role: 'user',
        text: message,
      },
    ]);

    setChatInput('');
    setChatLoading(true);
    setMascotState('thinking');

    try {
      const response = await fetch(
        '/api/portal/atlas/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
          }),
        },
      );

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
            item =>
              String(item.id) ===
              String(action.id),
          );

          if (match) {
            setSelected(match);
          }
        }

        if (action.type === 'open_tab') {
          setActiveTab(action.tab);
        }

        if (
          action.type === 'mascot_animation' &&
          action.animation === 'celebrate'
        ) {
          setMascotState('celebrate');
        }

        if (
          action.type === 'mascot_animation' &&
          action.animation === 'point'
        ) {
          setMascotState('point');
        }

        if (action.type === 'suggest_run') {
          setMessages(current => [
            ...current,
            {
              role: 'atlas',
              text:
                'Use the Run Atlas button above to search for new direct opportunities and project signals.',
            },
          ]);
        }
      }
    } catch {
      setMessages(current => [
        ...current,
        {
          role: 'atlas',
          text:
            'I could not reach the Atlas API. Make sure uvicorn is running on port 8000.',
        },
      ]);
    } finally {
      setChatLoading(false);

      window.setTimeout(() => {
        setMascotState('idle');
      }, 2200);
    }
  }

  async function runAtlas() {
    setRunning(true);
    setMascotState('thinking');

    try {
      const response = await fetch(
        '/api/portal/atlas/run',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            direct_limit: 2,
            signal_limit: 2,
          }),
        },
      );

      const data = await response.json();

      setMessages(current => [
        ...current,
        {
          role: 'atlas',
          text: data.success
            ? 'Atlas completed the pipeline successfully. I refreshed the opportunity feed.'
            : `Atlas finished with a warning: ${
                data.output ??
                'No output was returned.'
              }`,
        },
      ]);

      await loadData();
      await loadDoctor();

      setMascotState(
        data.success ? 'celebrate' : 'idle',
      );
    } finally {
      setRunning(false);

      window.setTimeout(() => {
        setMascotState('idle');
      }, 2200);
    }
  }

  return (
    <main
      className="min-h-screen p-4 md:p-6"
      style={{
        backgroundColor: THEME.bg,
        color: THEME.ink,
      }}
    >
      <div className="mx-auto max-w-[1700px]">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <a
              href="/portal"
              className="text-xs font-light"
              style={{ color: THEME.blue }}
            >
              ← Ceto Portal
            </a>

            <p
              className="mt-3 text-xs font-light uppercase tracking-[0.24em]"
              style={{ color: THEME.blue }}
            >
              Ceto Intelligence
            </p>

            <h1 className="mt-1 text-3xl font-light">
              Atlas Command Center
            </h1>

            <p
              className="mt-1 text-sm font-light"
              style={{
                color: 'rgba(20,35,55,0.55)',
              }}
            >
              Opportunity intelligence, environmental
              project signals, business scoring, map
              visualization, and agent health.
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
                ? 'Atlas connected'
                : 'Connecting'}
            </div>

            <button
              type="button"
              onClick={runAtlas}
              disabled={running}
              className="rounded-full px-5 py-2 text-xs text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                backgroundColor: THEME.blue,
              }}
            >
              {running ? 'Atlas is working…' : 'Run Atlas'}
            </button>
          </div>
        </header>

        <nav
          className="mb-5 flex flex-wrap gap-2 rounded-2xl p-2"
          style={{
            backgroundColor: THEME.surface,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {[
            ['command', 'Command Center'],
            ['opportunities', 'Opportunities'],
            ['doctor', 'Atlas Doctor'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveTab(
                  value as typeof activeTab,
                )
              }
              className="rounded-xl px-4 py-2 text-sm font-light"
              style={{
                backgroundColor:
                  activeTab === value
                    ? THEME.blue
                    : 'transparent',
                color:
                  activeTab === value
                    ? 'white'
                    : THEME.ink,
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'command' && (
          <>
            <section className="mb-5 grid gap-4 md:grid-cols-4">
              {[
                [
                  'Saved Records',
                  health?.opportunity_count ??
                    opportunities.length,
                ],
                ['Direct Pipeline', directCount],
                ['Project Signals', signalCount],
                [
                  'Average Score',
                  averageScore
                    ? averageScore.toFixed(1)
                    : '—',
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor:
                      THEME.surfaceStrong,
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <p
                    className="text-xs font-light uppercase tracking-wider"
                    style={{
                      color:
                        'rgba(20,35,55,0.45)',
                    }}
                  >
                    {label}
                  </p>

                  <p className="mt-2 text-3xl font-light">
                    {value}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <div
                className="relative min-h-[520px] overflow-hidden rounded-3xl"
                style={{
                  background:
                    'linear-gradient(145deg, #DCE8EE 0%, #EEF4F3 50%, #E6DDD1 100%)',
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div className="absolute left-5 top-5 z-10">
                  <p className="text-sm font-light">
                    Texas Opportunity Map
                  </p>

                  <p
                    className="text-xs font-light"
                    style={{
                      color:
                        'rgba(20,35,55,0.5)',
                    }}
                  >
                    Select a marker to inspect a
                    project.
                  </p>
                </div>

                <div className="absolute inset-10 top-20 rounded-[45%_55%_50%_50%] border border-white/80 bg-white/30 shadow-inner">
                  <div className="absolute inset-8 rounded-[40%] border border-dashed border-slate-500/20" />
                </div>

                {opportunities
                  .slice(0, 20)
                  .map((item, index) => {
                    const position =
                      markerPosition(
                        item.location,
                        index,
                      );

                    const isSelected =
                      String(selected?.id) ===
                      String(item.id);

                    return (
                      <button
                        key={`${item.table}-${item.id}`}
                        type="button"
                        onClick={() =>
                          setSelected(item)
                        }
                        title={`${item.title} — ${item.score}`}
                        className="absolute z-20 flex items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-lg transition hover:scale-125"
                        style={{
                          left: position.left,
                          top: position.top,
                          width: isSelected
                            ? 38
                            : 28,
                          height: isSelected
                            ? 38
                            : 28,
                          backgroundColor:
                            scoreColor(item.score),
                          border: isSelected
                            ? '4px solid white'
                            : '2px solid white',
                          transform:
                            'translate(-50%, -50%)',
                        }}
                      >
                        {Math.round(item.score)}
                      </button>
                    );
                  })}

                {!opportunities.length &&
                  !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-light">
                      Run Atlas to populate the map.
                    </div>
                  )}
              </div>

              <aside
                className="rounded-3xl p-5"
                style={{
                  backgroundColor:
                    THEME.surfaceStrong,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <p
                  className="text-xs font-light uppercase tracking-wider"
                  style={{
                    color:
                      'rgba(20,35,55,0.45)',
                  }}
                >
                  Selected opportunity
                </p>

                {selected ? (
                  <>
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <h2 className="text-xl font-light">
                        {selected.title}
                      </h2>

                      <span
                        className="rounded-full px-3 py-1 text-xs text-white"
                        style={{
                          backgroundColor:
                            scoreColor(
                              selected.score,
                            ),
                        }}
                      >
                        {Math.round(
                          selected.score,
                        )}
                      </span>
                    </div>

                    <dl className="mt-5 space-y-4 text-sm font-light">
                      <div>
                        <dt
                          className="text-xs uppercase tracking-wider"
                          style={{
                            color:
                              'rgba(20,35,55,0.4)',
                          }}
                        >
                          Organization
                        </dt>
                        <dd className="mt-1">
                          {selected.organization}
                        </dd>
                      </div>

                      <div>
                        <dt
                          className="text-xs uppercase tracking-wider"
                          style={{
                            color:
                              'rgba(20,35,55,0.4)',
                          }}
                        >
                          Location
                        </dt>
                        <dd className="mt-1">
                          {selected.location}
                        </dd>
                      </div>

                      <div>
                        <dt
                          className="text-xs uppercase tracking-wider"
                          style={{
                            color:
                              'rgba(20,35,55,0.4)',
                          }}
                        >
                          Status
                        </dt>
                        <dd className="mt-1 capitalize">
                          {selected.status}
                        </dd>
                      </div>
                    </dl>

                    {selected.summary && (
                      <p
                        className="mt-5 text-sm font-light leading-relaxed"
                        style={{
                          color:
                            'rgba(20,35,55,0.68)',
                        }}
                      >
                        {selected.summary}
                      </p>
                    )}

                    {selected.source_url && (
                      <a
                        href={selected.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-block text-sm"
                        style={{
                          color: THEME.blue,
                        }}
                      >
                        Open source ↗
                      </a>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm font-light">
                    Select a map marker.
                  </p>
                )}
              </aside>
            </section>
          </>
        )}

        {activeTab === 'opportunities' && (
          <section
            className="overflow-hidden rounded-3xl"
            style={{
              backgroundColor:
                THEME.surfaceStrong,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <div
              className="px-5 py-4"
              style={{
                borderBottom: `1px solid ${THEME.border}`,
              }}
            >
              <h2 className="text-lg font-light">
                Atlas Opportunities
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr
                    style={{
                      color:
                        'rgba(20,35,55,0.45)',
                    }}
                  >
                    <th className="px-5 py-3 font-light">
                      Score
                    </th>
                    <th className="px-5 py-3 font-light">
                      Opportunity
                    </th>
                    <th className="px-5 py-3 font-light">
                      Organization
                    </th>
                    <th className="px-5 py-3 font-light">
                      Location
                    </th>
                    <th className="px-5 py-3 font-light">
                      Pipeline
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {opportunities.map(item => (
                    <tr
                      key={`${item.table}-${item.id}`}
                      className="cursor-pointer transition hover:bg-slate-50"
                      style={{
                        borderTop: `1px solid ${THEME.border}`,
                      }}
                      onClick={() => {
                        setSelected(item);
                        setActiveTab('command');
                      }}
                    >
                      <td className="px-5 py-4">
                        <span
                          className="rounded-full px-3 py-1 text-xs text-white"
                          style={{
                            backgroundColor:
                              scoreColor(
                                item.score,
                              ),
                          }}
                        >
                          {Math.round(
                            item.score,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.title}
                      </td>

                      <td className="px-5 py-4">
                        {item.organization}
                      </td>

                      <td className="px-5 py-4">
                        {item.location}
                      </td>

                      <td className="px-5 py-4">
                        {item.table}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'doctor' && (
          <section
            className="rounded-3xl p-5"
            style={{
              backgroundColor:
                THEME.surfaceStrong,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-light">
                  Atlas Doctor
                </h2>
                <p
                  className="text-xs font-light"
                  style={{
                    color:
                      'rgba(20,35,55,0.45)',
                  }}
                >
                  Agents, models, database,
                  dependencies, reports, and Git.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDoctor}
                className="rounded-full px-4 py-2 text-xs text-white"
                style={{
                  backgroundColor: THEME.blue,
                }}
              >
                Refresh
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {doctorChecks.map(check => (
                <div
                  key={check.name}
                  className="rounded-2xl p-4"
                  style={{
                    border: `1px solid ${THEME.border}`,
                    backgroundColor:
                      'rgba(255,255,255,0.5)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-light">
                      {check.name}
                    </p>

                    <span
                      className="rounded-full px-2 py-1 text-[10px] uppercase"
                      style={{
                        color:
                          check.status === 'ok'
                            ? THEME.green
                            : check.status ===
                                'fail'
                              ? '#B83232'
                              : THEME.orange,
                        backgroundColor:
                          'rgba(20,35,55,0.04)',
                      }}
                    >
                      {check.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">
                    {String(
                      check.value ?? '—',
                    )}
                  </p>

                  {check.detail && (
                    <p
                      className="mt-1 text-xs font-light"
                      style={{
                        color:
                          'rgba(20,35,55,0.48)',
                      }}
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

      <div
        className={`atlas-mascot ${
          mascotState === 'thinking'
            ? 'atlas-thinking'
            : mascotState === 'celebrate'
              ? 'atlas-celebrate'
              : mascotState === 'point'
                ? 'atlas-point'
                : ''
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setChatOpen(current => !current)
          }
          className="atlas-elephant"
          aria-label="Open Atlas chat"
        >
          🐘
        </button>

        <div className="atlas-shadow" />
      </div>

      {chatOpen && (
        <aside
          className="fixed bottom-28 right-4 z-[9998] flex h-[520px] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-3xl shadow-2xl md:right-6"
          style={{
            backgroundColor:
              THEME.surfaceStrong,
            border: `1px solid ${THEME.border}`,
            backdropFilter: 'blur(18px)',
          }}
        >
          <header
            className="flex items-center justify-between px-5 py-4"
            style={{
              borderBottom: `1px solid ${THEME.border}`,
            }}
          >
            <div>
              <p className="text-sm font-light">
                Atlas Assistant
              </p>
              <p
                className="text-[11px] font-light"
                style={{
                  color:
                    'rgba(20,35,55,0.45)',
                }}
              >
                Opportunity intelligence agent
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

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm font-light leading-relaxed ${
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
                  backgroundColor:
                    'rgba(47,93,140,0.08)',
                }}
              >
                Atlas is thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 p-4"
            style={{
              borderTop: `1px solid ${THEME.border}`,
            }}
          >
            <input
              value={chatInput}
              onChange={event =>
                setChatInput(
                  event.target.value,
                )
              }
              placeholder="Ask Atlas about opportunities..."
              className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor:
                  'rgba(20,35,55,0.04)',
                border: `1px solid ${THEME.border}`,
              }}
            />

            <button
              type="submit"
              disabled={
                chatLoading ||
                !chatInput.trim()
              }
              className="rounded-xl px-4 py-3 text-sm text-white disabled:opacity-50"
              style={{
                backgroundColor: THEME.blue,
              }}
            >
              Ask
            </button>
          </form>
        </aside>
      )}

      <style jsx global>{`
        .atlas-mascot {
          position: fixed;
          right: 24px;
          bottom: 18px;
          z-index: 9999;
          width: 92px;
          height: 92px;
          animation: atlasWalk 8s ease-in-out infinite;
        }

        .atlas-elephant {
          position: relative;
          z-index: 2;
          width: 82px;
          height: 82px;
          border-radius: 999px;
          border: 1px solid rgba(47, 93, 140, 0.28);
          background:
            radial-gradient(
              circle at 35% 25%,
              rgba(255, 255, 255, 0.98),
              rgba(220, 232, 238, 0.95)
            );
          font-size: 52px;
          box-shadow:
            0 16px 40px rgba(20, 35, 55, 0.22);
          cursor: pointer;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .atlas-elephant:hover {
          transform: translateY(-7px) scale(1.06);
          box-shadow:
            0 20px 50px rgba(47, 93, 140, 0.32);
        }

        .atlas-shadow {
          position: absolute;
          left: 13px;
          bottom: 1px;
          width: 62px;
          height: 14px;
          border-radius: 50%;
          background: rgba(20, 35, 55, 0.16);
          filter: blur(5px);
          animation: atlasShadow 2s ease-in-out infinite;
        }

        .atlas-thinking .atlas-elephant {
          animation: atlasThink 0.8s ease-in-out infinite;
        }

        .atlas-celebrate .atlas-elephant {
          animation: atlasCelebrate 0.55s ease-in-out 4;
        }

        .atlas-point .atlas-elephant {
          animation: atlasPoint 0.7s ease-in-out 3;
        }

        @keyframes atlasWalk {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-28px);
          }
        }

        @keyframes atlasShadow {
          0%,
          100% {
            transform: scaleX(1);
            opacity: 0.16;
          }
          50% {
            transform: scaleX(0.8);
            opacity: 0.1;
          }
        }

        @keyframes atlasThink {
          0%,
          100% {
            transform: rotate(-4deg);
          }
          50% {
            transform: rotate(5deg) translateY(-4px);
          }
        }

        @keyframes atlasCelebrate {
          0%,
          100% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-22px) rotate(8deg);
          }
        }

        @keyframes atlasPoint {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-18px) rotate(-8deg);
          }
        }
      `}</style>
    </main>
  );
}

'use client';
import { useState, useRef } from 'react';

export default function AstraQuery() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role:string;content:string}[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    if (!query.trim() || loading) return;
    const q = query.trim();
    setQuery('');
    setHistory(h => [...h, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/astra/query', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, history }),
      });
      const data = await res.json();
      setHistory(h => [...h, { role: 'assistant', content: data.response || data.error }]);
    } catch { setHistory(h => [...h, { role: 'assistant', content: 'ASTRA offline.' }]); }
    finally { setLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
  };

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.35em', marginBottom: 4 }}>ASTRA · LOCUS QUERY CONSOLE</div>
        <div style={{ color: '#2a2a2a', fontSize: 9 }}>EP-grade environmental intelligence · TCEQ · EPA · ASTM E1527-21</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #111', marginBottom: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {history.length === 0 && (
          <div style={{ color: '#222', fontSize: 10, fontStyle: 'italic' }}>Ask ASTRA about RECs, HRECs, regulatory compliance, wetland delineation, Phase I scope, TCEQ databases, soil classifications, or any environmental topic.</div>
        )}
        {history.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: m.role === 'user' ? '#B08840' : '#444', fontSize: 9, letterSpacing: '0.2em', flexShrink: 0, paddingTop: 2 }}>{m.role === 'user' ? 'YOU' : 'ASTRA'}</span>
            <div style={{ color: m.role === 'user' ? '#888' : '#666', fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: '#B08840', fontSize: 9, letterSpacing: '0.2em' }}>ASTRA PROCESSING...</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())}
          placeholder="Ask ASTRA: What constitutes a REC under ASTM E1527-21? Is this site in a TCEQ database? What are SWPPP requirements for this project?"
          style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#888', fontSize: 11, padding: '10px 14px', outline: 'none' }} />
        <button onClick={submit} disabled={loading}
          style={{ padding: '10px 24px', border: '1px solid #B08840', color: '#B08840', background: 'transparent', fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          SEND
        </button>
      </div>
    </div>
  );
}

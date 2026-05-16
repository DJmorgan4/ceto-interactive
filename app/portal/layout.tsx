import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ceto Portal — ASTRA Command',
  description: 'Ceto Interactive environmental intelligence workspace.',
};

const NAV = [
  { href: '/portal', label: 'COMMAND', sub: 'Dashboard' },
  { href: '/portal/reports', label: 'REPORTS', sub: 'Phase I · II · SWPPP' },
  { href: '/portal/astra-query', label: 'ASTRA', sub: 'LOCUS Query' },
  { href: '/portal/regulatory', label: 'REGULATORY', sub: 'Live Scan' },
  { href: '/portal/swppp', label: 'SWPPP', sub: 'TXR150000' },
  { href: '/portal/site-intelligence', label: 'STRATUM', sub: 'Site Intel' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid #1a1a1a', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, background: '#B08840', borderRadius: '50%' }} />
            <span style={{ color: '#B08840', fontSize: 10, letterSpacing: '0.3em', fontWeight: 300 }}>CETO INTERACTIVE</span>
            <span style={{ color: '#2a2a2a', fontSize: 10, letterSpacing: '0.2em' }}>ASTRA COMMAND</span>
          </div>
          <nav style={{ display: 'flex', gap: 2 }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} style={{ padding: '0 12px', height: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '1px solid transparent', textDecoration: 'none' }}
                className="nav-item">
                <span style={{ color: '#888', fontSize: 9, letterSpacing: '0.22em' }}>{n.label}</span>
                <span style={{ color: '#3a3a3a', fontSize: 8, letterSpacing: '0.12em' }}>{n.sub}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%' }} />
          <span style={{ color: '#2a2a2a', fontSize: 9, letterSpacing: '0.2em' }}>STRATUM · LOCUS · NEXUS</span>
        </div>
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
      <style>{`.nav-item:hover span:first-child { color: #B08840 !important; } .nav-item:hover { border-bottom-color: #B08840 !important; }`}</style>
    </div>
  );
}

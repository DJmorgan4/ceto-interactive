import dynamic from 'next/dynamic'

const SiteIntelligenceClient = dynamic(
  () => import('./client'),
  { ssr: false, loading: () => (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'Inter, sans-serif' }}>
      Loading map...
    </div>
  )}
)

export default function SiteIntelligencePage() {
  return <SiteIntelligenceClient />
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ceto Portal — Operations',
  description: 'Ceto Interactive environmental intelligence workspace.',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-root">{children}</div>;
}

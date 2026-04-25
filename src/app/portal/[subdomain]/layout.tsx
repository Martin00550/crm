import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgencyBySubdomain } from '@/lib/branding';
import { BrandedLayout } from '@/components/portal/BrandedLayout';

export const dynamic = 'force-dynamic';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain?: string }>;
}

export async function generateMetadata({ params }: PortalLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const agency = await getAgencyBySubdomain(resolvedParams.subdomain || '');
  
  if (!agency || !agency.whiteLabelEnabled) {
    return { title: 'Portal Not Found' };
  }

  return {
    title: `${agency.name} | Insurance Portal`,
    description: agency.branding.description || `Insurance services from ${agency.name}`,
    icons: agency.branding.faviconUrl ? [{ rel: 'icon', url: agency.branding.faviconUrl }] : undefined,
  };
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const resolvedParams = await params;
  const agency = await getAgencyBySubdomain(resolvedParams.subdomain || '');
  
  // Check if agency exists and has white-label enabled
  if (!agency || !agency.whiteLabelEnabled) {
    notFound();
  }

  // Check if enterprise tier
  if (agency.subscriptionTier !== 'enterprise') {
    notFound();
  }

  return (
    <BrandedLayout agencyName={agency.name} branding={agency.branding}>
      {children}
    </BrandedLayout>
  );
}

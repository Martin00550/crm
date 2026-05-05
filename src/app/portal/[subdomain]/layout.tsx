import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgencyBySubdomain, getClientAndAgencyBySubdomain } from '@/lib/branding';
import { BrandedLayout } from '@/components/portal/BrandedLayout';

export const dynamic = 'force-dynamic';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain?: string }>;
}

export async function generateMetadata({ params }: PortalLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  
  // Try client
  const clientData = await getClientAndAgencyBySubdomain(resolvedParams.subdomain || '');
  if (clientData) {
    const agency = clientData.agency;
    return {
      title: `${clientData.client.name} | Client Portal`,
      description: `Secure document portal provided by ${agency.name}`,
      icons: agency.branding.faviconUrl ? [{ rel: 'icon', url: agency.branding.faviconUrl }] : undefined,
    };
  }

  // Try agency
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
  
  // Try Client First
  const clientData = await getClientAndAgencyBySubdomain(resolvedParams.subdomain || '');
  if (clientData) {
    return (
      <BrandedLayout agencyName={clientData.agency.name} branding={clientData.agency.branding}>
        {children}
      </BrandedLayout>
    );
  }

  // Try Agency
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

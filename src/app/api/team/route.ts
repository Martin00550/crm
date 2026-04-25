import { NextRequest, NextResponse } from 'next/server';
import { getTeamMembers, canAddTeamMember } from '@/lib/team-access';
import { withApiSecurity } from '@/lib/api-security';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    const members = await getTeamMembers(agencyId!);
    const canAdd = await canAddTeamMember(agencyId!);


    return NextResponse.json({ members, canAdd });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'team.list',
  }
);

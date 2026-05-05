import { NextRequest, NextResponse } from 'next/server';
import { runRenewalCheck } from '@/lib/renewal-monitor';
import { runCommissionCheck } from '@/lib/commission-monitor';
import { logger } from '@/lib/logger';

// POST /api/jobs/scheduler - Run all scheduled notification jobs
export async function POST(request: NextRequest) {
  // Check for scheduler secret to prevent unauthorized triggers
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.SCHEDULER_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { job } = body;

    let result;
    
    switch (job) {
      case 'renewal-check':
        await runRenewalCheck();
        result = { message: 'Renewal check completed' };
        break;
        
      case 'commission-check':
        await runCommissionCheck();
        result = { message: 'Commission check completed' };
        break;
        
      case 'all':
        await runRenewalCheck();
        await runCommissionCheck();
        result = { message: 'All scheduled jobs completed' };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error running scheduled job', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

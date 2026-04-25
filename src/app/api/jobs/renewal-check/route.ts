import { NextRequest, NextResponse } from 'next/server';
import { runRenewalCheck } from '@/lib/renewal-monitor';

// POST /api/jobs/renewal-check - Run renewal notification check
export async function POST(request: NextRequest) {
  // Check for scheduler secret to prevent unauthorized triggers
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.SCHEDULER_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runRenewalCheck();
    
    return NextResponse.json({
      success: true,
      message: 'Renewal check completed successfully',
    });
  } catch (error) {
    console.error('Error running renewal check:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest-client';
import { functions } from '@/lib/inngest';

export const runtime = 'nodejs';

// Inngest signing key for webhook verification
const INNGEST_SIGNING_KEY = process.env.INNGEST_SIGNING_KEY;

if (!INNGEST_SIGNING_KEY && process.env.NODE_ENV === 'production') {
  console.error('WARNING: INNGEST_SIGNING_KEY not set in production');
}

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  streaming: false,
});

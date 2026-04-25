import { NextRequest, NextResponse } from 'next/server';
import { openAPIDocument } from '@/lib/openapi';

export async function GET(request: NextRequest) {
  return NextResponse.json(openAPIDocument, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

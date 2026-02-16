import { NextResponse } from 'next/server';

// Authentication has been removed. These handlers are kept as no-ops
// so any stale links to /api/auth/* don't 404.

export async function GET() {
  return NextResponse.json({ message: 'Auth disabled' }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ message: 'Auth disabled' }, { status: 200 });
}

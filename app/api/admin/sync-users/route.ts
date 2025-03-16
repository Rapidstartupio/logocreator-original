import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Sync users endpoint' });
}

export async function POST() {
  try {
    // Add your sync logic here
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Sync users error:', err);
    return NextResponse.json(
      { error: 'Failed to sync users' },
      { status: 500 }
    );
  }
}

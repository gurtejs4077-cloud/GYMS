import { NextResponse } from 'next/server';
import { members } from '@/lib/data';

export async function GET() {
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const data = await request.json();
  // In a real app, you'd save to a DB here
  console.log('Saving new member:', data);
  return NextResponse.json({ success: true, member: data });
}

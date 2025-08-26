import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

const KEY = 'data';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await prisma.setting.upsert({ where: { key: KEY }, update: { value: JSON.stringify(data) }, create: { key: KEY, value: JSON.stringify(data) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data settings' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return NextResponse.json(row ? JSON.parse(row.value) : { history: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data settings' }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

const KEY = 'permissions';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await prisma.setting.upsert({ where: { key: KEY }, update: { value: JSON.stringify(data) }, create: { key: KEY, value: JSON.stringify(data) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return NextResponse.json(row ? JSON.parse(row.value) : {});
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 });
  }
}



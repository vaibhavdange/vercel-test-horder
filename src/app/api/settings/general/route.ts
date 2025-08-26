import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await prisma.$transaction(async (tx) => {
      await tx.setting.upsert({ where: { key: 'general' }, update: { value: JSON.stringify(data) }, create: { key: 'general', value: JSON.stringify(data) } });
      if (data?.currency) {
        await tx.setting.upsert({ where: { key: 'currency' }, update: { value: String(data.currency) }, create: { key: 'currency', value: String(data.currency) } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save general settings' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'general' } });
    const json = row ? JSON.parse(row.value) : {};
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load general settings' }, { status: 500 });
  }
}



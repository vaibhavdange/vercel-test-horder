import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    const rows = await prisma.setting.findMany();
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (typeof data?.key === 'string' && typeof data?.value !== 'undefined') {
      const { key, value, description } = data;
      const row = await prisma.setting.upsert({
        where: { key },
        update: { value: typeof value === 'string' ? value : JSON.stringify(value), description },
        create: { key, value: typeof value === 'string' ? value : JSON.stringify(value), description },
      });
      return NextResponse.json(row);
    }
    // Bulk upsert when object map provided
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data);
      for (const [key, value] of entries) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
          create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
        });
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

const KEY = 'printers';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await prisma.setting.upsert({ where: { key: KEY }, update: { value: JSON.stringify(data) }, create: { key: KEY, value: JSON.stringify(data) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save printers' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    const defaultBill = {
      paper: '58',
      business: { name: 'Your Store' },
      tax: { showSplitGST: true, gstRatePercent: 5 },
      extras: { showPaymentDetails: true },
      footer: { thankYouText: 'Thank you for your order!' }
    };
    if (!row) {
      return NextResponse.json({ profiles: [], bill: defaultBill });
    }
    const parsed = row?.value ? JSON.parse(row.value) : {};
    const profiles = Array.isArray(parsed?.profiles) ? parsed.profiles : [];
    const bill = parsed?.bill && typeof parsed.bill === 'object' ? parsed.bill : defaultBill;
    return NextResponse.json({ profiles, bill });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load printers' }, { status: 500 });
  }
}



import { NextResponse } from 'next/server';

// Printers are disabled for now; serve stubbed responses to avoid DB access
export async function GET() {
  const defaultBill = {
    paper: '58',
    business: { name: 'Your Store' },
    tax: { showSplitGST: true, gstRatePercent: 5 },
    extras: { showPaymentDetails: true },
    footer: { thankYouText: 'Thank you for your order!' }
  };

  return NextResponse.json({ profiles: [], bill: defaultBill });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}



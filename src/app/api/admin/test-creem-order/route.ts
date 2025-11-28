import { env } from '@/env';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId') || 'ord_qGyz2nDwkbNMoe1VNreVY';

  try {
    const creemApiUrl = env.CREEM_API_KEY.startsWith('creem_test_')
      ? 'https://test-api.creem.io'
      : 'https://api.creem.io';

    const orderResponse = await fetch(`${creemApiUrl}/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${env.CREEM_API_KEY}`,
      },
    });

    const orderData = await orderResponse.json();

    return NextResponse.json({
      orderId,
      apiUrl: creemApiUrl,
      status: orderResponse.status,
      data: orderData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

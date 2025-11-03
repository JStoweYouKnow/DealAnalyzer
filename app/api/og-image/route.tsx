import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const address = searchParams.get('address') || 'Property Analysis';
    const price = searchParams.get('price') || '$0';
    const cashFlow = searchParams.get('cashFlow') || '$0';
    const cocReturn = searchParams.get('cocReturn') || '0%';
    const status = searchParams.get('status') || 'neutral';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              📊 Deal Analyzer
            </div>
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              Real Estate Investment Analysis
            </div>
          </div>

          {/* Main Content Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              borderRadius: '24px',
              padding: '50px',
              flex: 1,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Property Address */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#111827',
                marginBottom: '40px',
                lineHeight: 1.2,
              }}
            >
              {address}
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'flex',
                gap: '40px',
              }}
            >
              {/* Price */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div
                  style={{
                    fontSize: '20px',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  Purchase Price
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    fontWeight: '700',
                    color: '#6366f1',
                  }}
                >
                  {price}
                </div>
              </div>

              {/* Cash Flow */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div
                  style={{
                    fontSize: '20px',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  Monthly Cash Flow
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    fontWeight: '700',
                    color: cashFlow.startsWith('-') ? '#dc2626' : '#059669',
                  }}
                >
                  {cashFlow}
                </div>
              </div>

              {/* CoC Return */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div
                  style={{
                    fontSize: '20px',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  CoC Return
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    fontWeight: '700',
                    color: '#6366f1',
                  }}
                >
                  {cocReturn}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div
              style={{
                display: 'flex',
                marginTop: 'auto',
                paddingTop: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '24px',
                  fontWeight: '600',
                  background: status === 'pass' ? '#d1fae5' : status === 'fail' ? '#fee2e2' : '#e5e7eb',
                  color: status === 'pass' ? '#065f46' : status === 'fail' ? '#991b1b' : '#4b5563',
                }}
              >
                {status === 'pass' ? '✓ Meets Criteria' : status === 'fail' ? '✗ Does Not Meet' : '○ Neutral'}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

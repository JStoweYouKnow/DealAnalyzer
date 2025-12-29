import { NextRequest, NextResponse } from "next/server";

// This endpoint runs weekly via Vercel Cron
// Configure in vercel.json to run every Monday at 9 AM

interface DigestData {
  email: string;
  userName: string;
  topDeals: Array<{
    address: string;
    price: number;
    cashFlow: number;
    cocReturn: number;
    capRate: number;
    meetsCriteria: boolean;
  }>;
  marketInsights: Array<{
    city: string;
    state: string;
    trend: string;
    medianPrice: number;
  }>;
  stats: {
    totalAnalyzed: number;
    dealsPassingCriteria: number;
    averageCashFlow: number;
  };
}

async function sendDigestEmail(data: DigestData): Promise<boolean> {
  console.log(`[Email Digest] Preparing to send to: ${data.email}`);
  console.log(`[Email Digest] Top deals: ${data.topDeals.length}`);
  console.log(`[Email Digest] Stats:`, data.stats);

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM = process.env.RESEND_FROM || process.env.EMAIL_FROM;

  // If Resend API key is available, send real email
  if (RESEND_API_KEY) {
    // Validate sender email if API key is present
    if (!RESEND_FROM || RESEND_FROM.trim() === '') {
      const errorMsg = '[Email Digest] ❌ RESEND_API_KEY is set but RESEND_FROM (or EMAIL_FROM) is missing or empty. Please set RESEND_FROM environment variable with a valid sender email (e.g., "Deal Analyzer <deals@yourdomain.com>").';
      console.error(errorMsg);
      return false;
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(RESEND_API_KEY);

      const { data: emailData, error } = await resend.emails.send({
        from: RESEND_FROM.trim(),
        to: data.email,
        subject: `Your Weekly Real Estate Digest - ${data.topDeals.length} Top Deals`,
        html: generateEmailHTML(data),
      });

      if (error) {
        console.error('[Email Digest] Resend error:', error);
        return false;
      }

      console.log(`[Email Digest] ✅ Email sent successfully to ${data.email}`, emailData);
      return true;
    } catch (error) {
      console.error('[Email Digest] Error sending email:', error);
      return false;
    }
  } else {
    // Fallback: Just log the email (for development/testing)
    console.warn('[Email Digest] ⚠️ No RESEND_API_KEY found, email not sent (dev mode)');
    console.log('[Email Digest] Would have sent email to:', data.email);
    console.log('[Email Digest] Email content preview:', generateEmailHTML(data).substring(0, 500));
    return true; // Return true in dev mode so cron doesn't fail
  }
}

function generateEmailHTML(data: DigestData): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  // Get base URL from environment variable with fallback
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com')
    .trim()
    .replace(/\/+$/, ''); // Remove trailing slashes
  
  // Helper to construct URLs without double slashes
  const buildUrl = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const currentYear = new Date().getFullYear();
  const dashboardUrl = buildUrl('/dashboard');
  const unsubscribeUrl = buildUrl('/unsubscribe');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .deal-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .badge-green { background: #d4edda; color: #155724; }
        .badge-red { background: #f8d7da; color: #721c24; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; text-align: center; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Your Weekly Real Estate Digest</h1>
        <p>Top deals and market insights from this week</p>
      </div>

      <div class="content">
        <h2>Hi ${data.userName}! 👋</h2>
        <p>Here's your personalized weekly summary of the best investment opportunities.</p>

        <!-- Stats Summary -->
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${data.stats.totalAnalyzed}</div>
            <div class="stat-label">Properties Analyzed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.dealsPassingCriteria}</div>
            <div class="stat-label">Pass Criteria</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.stats.averageCashFlow)}</div>
            <div class="stat-label">Avg Cash Flow</div>
          </div>
        </div>

        <!-- Top Deals -->
        <h3>🏆 Top Deals This Week</h3>
        ${data.topDeals.map(deal => `
          <div class="deal-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div>
                <strong>${deal.address}</strong>
                <div style="color: #666; font-size: 14px;">${formatCurrency(deal.price)}</div>
              </div>
              <span class="${deal.meetsCriteria ? 'badge badge-green' : 'badge badge-red'}">
                ${deal.meetsCriteria ? '✓ Meets Criteria' : '✗ Does Not Meet'}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; font-size: 14px;">
              <div>
                <div style="color: #666;">Cash Flow</div>
                <div style="font-weight: bold; color: ${deal.cashFlow > 0 ? '#28a745' : '#dc3545'};">
                  ${formatCurrency(deal.cashFlow)}/mo
                </div>
              </div>
              <div>
                <div style="color: #666;">CoC Return</div>
                <div style="font-weight: bold;">${formatPercent(deal.cocReturn)}</div>
              </div>
              <div>
                <div style="color: #666;">Cap Rate</div>
                <div style="font-weight: bold;">${formatPercent(deal.capRate)}</div>
              </div>
            </div>
          </div>
        `).join('')}

        <!-- Market Insights -->
        <h3>📈 Market Insights</h3>
        ${data.marketInsights.map(insight => `
          <div class="deal-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>${insight.city}, ${insight.state}</strong>
                <div style="color: #666; font-size: 14px;">
                  Median: ${formatCurrency(insight.medianPrice)}
                </div>
              </div>
              <span style="font-size: 24px;">
                ${insight.trend === 'up' ? '📈' : insight.trend === 'down' ? '📉' : '➡️'}
              </span>
            </div>
          </div>
        `).join('')}

        <div style="text-align: center; margin-top: 30px;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Full Analysis
          </a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this because you subscribed to weekly digests.</p>
        <p><a href="${unsubscribeUrl}" style="color: #667eea;">Unsubscribe</a></p>
        <p>© ${currentYear} Deal Analyzer. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[Cron] Unauthorized cron request');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting weekly digest generation...');

    // Check if Convex is configured
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!CONVEX_URL) {
      console.warn('[Cron] No Convex URL configured, using mock data');
      return await sendMockDigests();
    }

    try {
      // Fetch users from Convex
      const { ConvexHttpClient } = await import('convex/browser');
      const client = new ConvexHttpClient(CONVEX_URL);

      // Try to import Convex API - use relative path to avoid path alias issues
      let api;
      try {
        const apiModule = await import('../../../../convex/_generated/api');
        api = apiModule.api;
      } catch (importError) {
        console.warn('[Cron] Could not import Convex API (codegen may not be run):', importError);
        return await sendMockDigests();
      }

      // Get all users who should receive digest
      const users = await client.query(api.weeklyDigest.getUsersForDigest, {});

      console.log(`[Cron] Found ${users.length} users for digest`);

      const digestsSent = [];

      for (const user of users) {
        try {
          // Fetch user's weekly data from Convex
          const weeklyData = await client.query(api.weeklyDigest.getWeeklyDigestData, {
            userId: user.userId,
            weeksAgo: 1,
          });

          // Skip users with no activity
          if (weeklyData.stats.totalAnalyzed === 0) {
            console.log(`[Cron] Skipping user ${user.email} - no activity this week`);
            continue;
          }

          // Fetch market insights
          const marketInsights = await client.query(api.weeklyDigest.getMarketInsights, {
            limit: 3,
          });

          const digestData: DigestData = {
            email: user.email,
            userName: user.userName,
            topDeals: weeklyData.topDeals,
            marketInsights,
            stats: weeklyData.stats,
          };

          const sent = await sendDigestEmail(digestData);
          if (sent) {
            digestsSent.push(user.email);
          }
        } catch (userError) {
          console.error(`[Cron] Error processing digest for user ${user.email}:`, userError);
          // Continue to next user
        }
      }

      console.log(`[Cron] Weekly digest sent to ${digestsSent.length} users`);

      return NextResponse.json({
        success: true,
        message: `Digest sent to ${digestsSent.length} users`,
        recipients: digestsSent,
      });
    } catch (convexError) {
      console.error('[Cron] Convex error, falling back to mock data:', convexError);
      return await sendMockDigests();
    }
  } catch (error) {
    console.error('[Cron] Weekly digest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send digest' },
      { status: 500 }
    );
  }
}

// Fallback function for development/testing without Convex
async function sendMockDigests() {
  console.log('[Cron] Using mock data for weekly digest');

  const mockUsers = [
    {
      email: 'investor@example.com',
      userName: 'John Investor',
    },
  ];

  const digestsSent = [];

  for (const user of mockUsers) {
    const digestData: DigestData = {
      email: user.email,
      userName: user.userName,
      topDeals: [
        {
          address: '123 Investment St, Austin, TX',
          price: 350000,
          cashFlow: 450,
          cocReturn: 0.12,
          capRate: 0.075,
          meetsCriteria: true,
        },
        {
          address: '456 Property Ln, Dallas, TX',
          price: 280000,
          cashFlow: 320,
          cocReturn: 0.10,
          capRate: 0.068,
          meetsCriteria: true,
        },
        {
          address: '789 Real Estate Ave, Phoenix, AZ',
          price: 420000,
          cashFlow: -150,
          cocReturn: 0.05,
          capRate: 0.045,
          meetsCriteria: false,
        },
      ],
      marketInsights: [
        {
          city: 'Austin',
          state: 'TX',
          trend: 'up',
          medianPrice: 450000,
        },
        {
          city: 'Phoenix',
          state: 'AZ',
          trend: 'stable',
          medianPrice: 380000,
        },
      ],
      stats: {
        totalAnalyzed: 15,
        dealsPassingCriteria: 7,
        averageCashFlow: 285,
      },
    };

    const sent = await sendDigestEmail(digestData);
    if (sent) {
      digestsSent.push(user.email);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Mock digest sent to ${digestsSent.length} users`,
    recipients: digestsSent,
    mode: 'development',
  });
}

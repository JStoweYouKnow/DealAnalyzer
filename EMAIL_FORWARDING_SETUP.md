# Email Forwarding Setup Guide

## Overview

The DealAnalyzer now supports **automatic email forwarding** as an alternative to Gmail OAuth! This eliminates the need to add every user to your Google Cloud Console, making it much easier for users to get started.

## How It Works

### The Problem with Gmail OAuth

Previously, every user needed to:
1. Be manually added as a test user in your Google Cloud Console
2. Complete OAuth authentication flow
3. Grant access to their Gmail account

This doesn't scale and creates a poor user experience.

### The Email Forwarding Solution

Now users can simply:
1. Get their unique forwarding email address (e.g., `deals+user123@yourdomain.com`)
2. Create a Gmail filter to auto-forward deal emails to that address
3. Emails are automatically processed and appear in their deal pipeline

**No OAuth required!**

## Architecture

### Components

1. **Webhook Endpoint**: `/api/receive-email`
   - Receives emails from SendGrid Inbound Parse
   - Extracts property information using OpenAI
   - Creates email deals in the database

2. **Email Forwarding Setup Component**: `app/components/email-forwarding-setup.tsx`
   - Shows user their unique forwarding address
   - Provides step-by-step setup instructions
   - Displays on the deals page when no deals exist

3. **User Email Addresses**:
   - Format: `deals+{userId}@yourdomain.com`
   - Each user gets a unique identifier
   - Allows tracking which emails belong to which user

## SendGrid Inbound Parse Setup

### Prerequisites

- SendGrid account (free tier works)
- Domain with DNS access (for MX records)
- Vercel deployment (or any serverless platform)

### Step 1: Configure Domain

1. **Choose a subdomain** for receiving emails (e.g., `inbound.yourdomain.com`)

2. **Add MX record** to your DNS:
   ```
   Type: MX
   Host: inbound
   Value: mx.sendgrid.net
   Priority: 10
   ```

3. **Verify in SendGrid**:
   - Go to Settings → Inbound Parse → Add Host & URL
   - Enter your subdomain: `inbound.yourdomain.com`

### Step 2: Configure Webhook URL

1. In SendGrid Inbound Parse settings, set:
   - **Hostname**: `inbound.yourdomain.com`
   - **URL**: `https://yourapp.vercel.app/api/receive-email`
   - Check "POST raw, full MIME message"

2. Save the configuration

### Step 3: Test the Setup

Send a test email to `deals+test@inbound.yourdomain.com` and verify:
- Email is received by SendGrid
- Webhook is called successfully
- Email deal appears in your database

## Email Processing Flow

```
User's Gmail
    ↓ (Gmail Filter: Auto-forward)
    ↓
deals+user123@inbound.yourdomain.com
    ↓ (SendGrid Inbound Parse)
    ↓
POST /api/receive-email
    ↓
1. Extract user ID from email address
2. Parse email content (subject, body, attachments)
3. Use OpenAI to extract property data
4. Create content hash for deduplication
5. Store email deal in database
    ↓
Email Deal appears in user's pipeline
```

## User Setup Instructions

Users follow these simple steps:

### 1. Get Forwarding Address

Navigate to the Email Deals page and copy your unique forwarding address.

### 2. Create Gmail Filter

1. Open Gmail → Settings → Filters and Blocked Addresses
2. Click "Create a new filter"
3. Set criteria (e.g., from specific senders, contains keywords)
4. Check "Forward it to" and enter your forwarding address
5. Click "Create filter"

### 3. Start Receiving Deals

All matching emails will now be:
- Automatically forwarded to your unique address
- Processed by AI to extract property data
- Available in your deal pipeline

## Example Gmail Filter Criteria

**For Real Estate Deal Emails:**
```
From: deals@realestatelist.com
OR
From: notifications@investordeals.com
OR
Subject contains: "investment property"
OR
Subject contains: "deal alert"
```

**Action:**
- Forward to: `deals+user123@inbound.yourdomain.com`

## API Endpoint Details

### POST `/api/receive-email`

**Purpose**: Webhook endpoint for receiving emails from SendGrid

**Request Format**: `multipart/form-data` from SendGrid containing:
- `to`: Recipient email address
- `from`: Sender email address
- `subject`: Email subject
- `text`: Plain text body
- `html`: HTML body
- `envelope`: JSON with routing info
- `headers`: Email headers
- `attachments`: Attachment count
- `attachment-info`: Attachment metadata (JSON)

**Response**:
```json
{
  "success": true,
  "message": "Email processed successfully",
  "dealId": "abc123"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Authentication & Access Control Requirements**:
- Validate the SendGrid event webhook signature on every request by checking `X-Twilio-Email-Event-Webhook-Signature` and the accompanying timestamp using your configured SendGrid signing key/public key. Reject requests with mismatched signatures or timestamps outside your acceptable drift window.
- Enable IP allowlisting for SendGrid’s published webhook IP ranges to add defense in depth before any application logic runs.
- Require an additional shared secret, API key header, or mutual TLS credential that is configurable via environment variables; respond with `401`/`403` when it is missing or invalid.
- When using custom or third-party senders, sign requests or compute an HMAC that the endpoint verifies prior to processing.
- Apply strict rate limiting to the endpoint and log failed authentication attempts (without storing secrets) so you can investigate anomalies quickly.
- Reject any unsigned or unauthenticated request to prevent arbitrary POSTs from creating deals.

### Deduplication

Emails are deduplicated using a SHA-256 hash of:
- Sender email
- Subject line
- First 1000 characters of body

If an email with the same hash already exists, it's not processed again.

### Property Extraction

The webhook uses OpenAI GPT-4o-mini to extract property information from email content:

**Extracted Fields:**
- Address, city, state
- Purchase price
- Monthly rent
- Bedrooms, bathrooms
- Square footage
- Average Daily Rate (for STR)
- Occupancy rate
- Image URLs
- Source links (listing URLs, company websites, etc.)

## Benefits vs. Gmail OAuth

| Feature | Email Forwarding | Gmail OAuth |
|---------|-----------------|-------------|
| Setup Time | 2 minutes | 10+ minutes |
| User Approval Needed | No | Yes (for each user) |
| Scalability | Unlimited users | Limited to test users |
| Works in Serverless | Yes | Yes |
| Cost | ~$0.0001/email | Free (but complex setup) |
| Maintenance | Low | High (OAuth tokens expire) |
| User Experience | Simple forwarding | OAuth popup flow |
| Privacy | User controlled | Full Gmail access |

## Cost Analysis

### SendGrid Pricing
- **Free Tier**: Up to 100 emails/day
- **Essentials Plan**: $19.95/month for 50,000 emails
- **Pro Plan**: $89.95/month for 100,000 emails

**Average Cost**: $0.0001 - $0.002 per email

### OpenAI Pricing
- **GPT-4o-mini**: ~$0.00015 per email extraction
- Processing 1000 emails/month: ~$0.15

**Total Cost**: Very affordable even at scale!

## Security Considerations

### Email Verification

The webhook should verify requests are coming from SendGrid:
- Check SendGrid signature (if configured)
- Validate sender domain
- Rate limit the endpoint

### User Isolation

Each user gets a unique email identifier:
- `deals+user123@domain.com` → userId: `user123`
- Ensures emails are associated with the correct user
- No cross-user data leakage

### Content Sanitization

Email content is sanitized before processing:
- HTML is stripped for plain text extraction
- Malicious content is filtered
- URLs are validated before extraction

## Troubleshooting

### Emails Not Appearing

1. **Check DNS**: Verify MX record is set correctly
   ```bash
   dig MX inbound.yourdomain.com
   ```

2. **Check SendGrid**: Look at Inbound Parse activity logs

3. **Check Webhook**: Test the endpoint directly:
   ```bash
   curl -X POST https://yourapp.vercel.app/api/receive-email \
     -F "to=deals+test@domain.com" \
     -F "from=sender@example.com" \
     -F "subject=Test Property" \
     -F "text=Test email content"
   ```

4. **Check Logs**: Review server logs for errors

### Gmail Filter Not Working

1. **Verify filter is enabled**: Check Gmail filter settings
2. **Test manually**: Forward an email manually to verify the address works
3. **Check spam**: Forwarded emails might be going to spam

### Duplicate Emails

If seeing duplicate emails:
- Check content hash generation
- Verify deduplication logic in `/api/receive-email`
- Look for multiple Gmail filters forwarding the same email

## Migration from Gmail OAuth

For existing users with Gmail OAuth:

1. **Keep Gmail OAuth working** for existing users
2. **Show both options** on the deals page
3. **Recommend email forwarding** for new users
4. **Gradually migrate** existing users to forwarding

The deals page now shows:
- Email forwarding setup (recommended)
- Gmail OAuth option (legacy/alternative)

## Future Enhancements

Potential improvements:

- [ ] **Bulk email processing**: Process multiple emails in batch
- [ ] **Advanced filters**: Allow users to set up custom extraction rules
- [ ] **Email templates**: Recognize and parse specific email formats
- [ ] **Attachment processing**: Extract property data from PDF/Excel attachments
- [ ] **Reply handling**: Allow users to reply to deals via email
- [ ] **Email analytics**: Track which senders have the best deals
- [ ] **Smart categorization**: Auto-categorize emails by deal type

## Support

If users encounter issues:

1. **Check setup guide**: Ensure all steps were followed correctly
2. **Test with sample email**: Send a test email to verify the flow
3. **Review logs**: Check server logs for detailed error messages
4. **Contact support**: Reach out with the email subject and timestamp

## Example Use Cases

### Real Estate Investor

**Setup**:
- Forwarding address: `deals+investor1@domain.com`
- Gmail filter: Emails from 10+ deal sources
- Auto-forwards 20-50 deals/day

**Result**:
- All deals appear in one central pipeline
- AI extracts property data automatically
- Can analyze deals in bulk

### Wholesaler

**Setup**:
- Forwarding address: `deals+wholesaler1@domain.com`
- Gmail filter: Emails containing "wholesale" or "assignment"
- Processes 100+ deals/day

**Result**:
- Quick deal triage
- Automated property analysis
- Better deal flow management

### Property Manager

**Setup**:
- Forwarding address: `deals+manager1@domain.com`
- Gmail filter: New listing alerts from MLS
- Receives 30-100 listings/day

**Result**:
- Automatic listing organization
- Investment potential analysis
- Client matching opportunities

## Technical Implementation Notes

### Database Schema

Email deals are stored with:
- Unique ID
- User ID (extracted from forwarding address)
- Content hash (for deduplication)
- Extracted property data
- Original email content
- Analysis results (if analyzed)
- Status (new, reviewed, analyzed, archived)

### Error Handling

The webhook handles:
- Missing fields gracefully
- OpenAI API failures (falls back to empty extraction)
- Database connection issues (returns 500)
- Invalid email formats (returns 400)
- Duplicate emails (returns success with existing ID)

### Rate Limiting

Consider implementing:
- Per-user rate limits (e.g., 100 emails/hour)
- Global rate limits (e.g., 1000 emails/hour)
- SendGrid webhook signature validation

## Conclusion

Email forwarding is the **recommended approach** for email-based deal tracking because:

✅ **Simple**: 2-minute setup vs. complex OAuth flow
✅ **Scalable**: Unlimited users without Google Cloud approval
✅ **Reliable**: No OAuth token expiration issues
✅ **Private**: Users control what they forward
✅ **Affordable**: Extremely low cost per email
✅ **Serverless-friendly**: Works perfectly in serverless environments

This approach eliminates the need for users to be added to your Google Cloud Console test users, making the platform accessible to anyone!

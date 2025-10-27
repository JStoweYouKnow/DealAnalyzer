# Vercel Deployment Guide

## Prerequisites

1. **Clerk Account**: Sign up at [clerk.com](https://clerk.com) for authentication
2. **Convex Account**: Sign up at [convex.dev](https://convex.dev) for database
3. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Step 1: Deploy Convex Backend

```bash
# Deploy your Convex backend first
npm run convex:deploy
```

After deployment, Convex will provide:
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex backend URL
- `CONVEX_DEPLOYMENT` - Your deployment name

## Step 2: Set Up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Get your API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Configure redirect URLs:
   - Sign-in: `https://your-domain.vercel.app/sign-in`
   - Sign-up: `https://your-domain.vercel.app/sign-up`

## Step 3: Deploy to Vercel

### Option A: Via Web Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `JStoweYouKnow/DealAnalyzer`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build:next`
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install`

4. Add Environment Variables (click "Environment Variables"):
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
   CONVEX_DEPLOYMENT=prod:...
   ```

5. Click "Deploy"

### Option B: Via CLI (Alternative)

```bash
# Install Vercel CLI globally (may need sudo)
sudo npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 4: Configure Clerk for Production

After deployment, update your Clerk dashboard:

1. Go to **Configure** → **Paths**
2. Update redirect URLs to your Vercel domain:
   - Sign in URL: `https://your-app.vercel.app/sign-in`
   - Sign up URL: `https://your-app.vercel.app/sign-up`
   - After sign in: `https://your-app.vercel.app/`

## Step 5: Configure Convex for Production

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your deployment
3. Add your Vercel domain to **Allowed Origins**

## Step 6: Optional Integrations

### Gmail Integration
Add these environment variables in Vercel:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/gmail-callback
```

### OpenAI Integration
```
OPENAI_API_KEY=sk-...
```

### RentCast API
```
RENTCAST_API_KEY=your_key
```

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### 404 Errors
- Ensure `vercel.json` is in root directory
- Check that API routes are in `app/api/` directory
- Verify middleware.ts is properly configured

### Authentication Issues
- Double-check Clerk API keys
- Verify redirect URLs match your deployment domain
- Check middleware.ts configuration

## Useful Commands

```bash
# View deployment logs
vercel logs

# List deployments
vercel ls

# Set environment variable
vercel env add VARIABLE_NAME

# Pull environment variables locally
vercel env pull
```

## Production Checklist

- [ ] Convex backend deployed
- [ ] Clerk configured with production URLs
- [ ] All environment variables set in Vercel
- [ ] Build successful
- [ ] Authentication working
- [ ] API routes accessible
- [ ] Custom domain configured (optional)

## Support

- Vercel Docs: https://vercel.com/docs
- Clerk Docs: https://clerk.com/docs
- Convex Docs: https://docs.convex.dev

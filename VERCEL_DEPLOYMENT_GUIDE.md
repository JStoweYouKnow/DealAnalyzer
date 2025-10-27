# Vercel Deployment Guide 🚀

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code should be pushed to GitHub
3. **Environment Variables** - All keys from your `.env` file

## Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

## Step 2: Deploy via Vercel Dashboard (Recommended)

### 2.1 Connect GitHub Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select "Next.js" as the framework (should auto-detect)

### 2.2 Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build:next`
- **Output Directory**: `.next` (leave default)
- **Install Command**: `npm install`

## Step 3: Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

### 🔐 **Authentication (Clerk)**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_S125igLbSYhzE7j7DgFKunT3ALJ3Ku3kwCkatgJ8Qn
CLERK_FRONTEND_API_URL=large-wolf-5.clerk.accounts.dev
AUTH_SECRET=e66bfa1517a120798f4d286655028e3c11122dea4971aea516b4ff90ade2e519
```

### 🗄️ **Database (Convex)**
```
NEXT_PUBLIC_CONVEX_URL=https://strong-condor-993.convex.cloud
```

### 🤖 **AI Services**
```
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
RENTCAST_API_KEY=your_rentcast_api_key_here
```

### 📧 **Gmail Integration**
```
GMAIL_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=https://your-app-name.vercel.app/api/gmail-callback
```

**⚠️ Important**: Update `GMAIL_REDIRECT_URI` with your actual Vercel domain!

## Step 4: Update OAuth Redirect URLs

### 4.1 Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to "Authorized redirect URIs":
   ```
   https://your-app-name.vercel.app/api/gmail-callback
   ```

### 4.2 Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to your application
3. Go to "Domains" section
4. Add your Vercel domain:
   ```
   https://your-app-name.vercel.app
   ```

## Step 5: Deploy

### Option A: Via Dashboard
1. Click "Deploy" in Vercel dashboard
2. Wait for build to complete
3. Your app will be live at `https://your-app-name.vercel.app`

### Option B: Via CLI
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 6: Post-Deployment Setup

### 6.1 Test Authentication
1. Visit your deployed app
2. Test sign-in/sign-up functionality
3. Verify Clerk authentication works

### 6.2 Test Gmail Integration
1. Try connecting Gmail
2. Verify OAuth callback works with new domain
3. Test email syncing functionality

### 6.3 Test Property Analysis
1. Upload a property file
2. Verify AI analysis works
3. Check Convex database integration

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

### Environment Variables
- Double-check all env vars are set
- Ensure no typos in variable names
- Check that sensitive values are properly escaped

### Authentication Issues
- Verify Clerk domain configuration
- Check OAuth redirect URIs
- Ensure environment variables match

### Database Connection
- Verify Convex URL is correct
- Check Convex deployment status
- Ensure auth configuration is deployed

## Production Optimizations

### 6.1 Performance
- Enable Vercel Analytics
- Configure caching headers
- Optimize images and assets

### 6.2 Security
- Review environment variables
- Enable HTTPS only
- Configure CORS if needed

### 6.3 Monitoring
- Set up error tracking (Sentry)
- Configure logging
- Monitor performance metrics

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update OAuth redirect URIs to use custom domain

## Success Checklist ✅

- [ ] App builds successfully
- [ ] Environment variables configured
- [ ] Authentication works (Clerk)
- [ ] Database connection works (Convex)
- [ ] Gmail integration works
- [ ] Property analysis works
- [ ] All API routes respond correctly
- [ ] OAuth redirects work with production domain

Your real estate analyzer is now live on Vercel! 🎉

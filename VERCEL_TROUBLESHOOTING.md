# Vercel Deployment Troubleshooting Guide

## Common Deployment Issues & Solutions

### Issue 1: Build Fails - "Module not found"

**Error:**
```
Error: Cannot find module '@/components/...'
Module not found: Can't resolve '@/lib/...'
```

**Solution:**
1. Check `tsconfig.json` has correct path aliases:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

2. Ensure `next.config.mjs` doesn't override paths
3. Verify file paths are correct and case-sensitive

---

### Issue 2: Build Fails - TypeScript Errors

**Error:**
```
Type error: Property 'X' does not exist on type 'Y'
```

**Solution:**
1. Run locally first: `npm run build:next`
2. Fix TypeScript errors shown
3. Consider adding to `next.config.mjs` (temporary):
```js
typescript: {
  ignoreBuildErrors: true, // NOT recommended for production
},
```

---

### Issue 3: Build Fails - Missing Dependencies

**Error:**
```
Error: Cannot find package 'X'
```

**Solution:**
1. Ensure all dependencies are in `package.json`:
```bash
npm install <missing-package>
git add package.json package-lock.json
git commit -m "fix: add missing dependencies"
git push
```

2. Check for peer dependency issues:
```bash
npm install --legacy-peer-deps
```

---

### Issue 4: Environment Variables Not Working

**Error:**
- App works locally but not on Vercel
- `undefined` values for env variables

**Solution:**
1. In Vercel Dashboard → Settings → Environment Variables
2. Add ALL required variables from `.env.example`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CONVEX_URL`
   - etc.

3. **Important**: `NEXT_PUBLIC_*` variables must be prefixed to work in browser
4. Redeploy after adding env vars

---

### Issue 5: 404 on API Routes

**Error:**
- `/api/criteria` returns 404
- API routes not found

**Solution:**
1. Ensure API routes are in `app/api/` directory (not `pages/api/`)
2. Files must be named `route.ts` not `[name].ts`
3. Export HTTP method handlers:
```typescript
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }
```

---

### Issue 6: Deployment Succeeds but App Doesn't Work

**Symptoms:**
- Build succeeds
- App loads but shows errors
- Authentication doesn't work

**Solutions:**

#### Check Clerk Configuration:
1. Clerk Dashboard → Configure → Paths
2. Update to production URL:
   - Sign in URL: `https://your-app.vercel.app/sign-in`
   - Sign up URL: `https://your-app.vercel.app/sign-up`
   - After sign in: `https://your-app.vercel.app/`

#### Check Convex Configuration:
1. Convex Dashboard → Settings
2. Add Vercel domain to Allowed Origins
3. Verify `NEXT_PUBLIC_CONVEX_URL` in Vercel env vars

---

### Issue 7: Python Scripts Not Working

**Error:**
```
Error: spawn python3 ENOENT
```

**Solution:**
Vercel serverless functions don't support Python out of the box.

**Option A**: Use Vercel's Python runtime (separate functions)
**Option B**: Rewrite Python analysis in TypeScript/JavaScript
**Option C**: Use external API for Python processing

For now, disable Python features in production:
```typescript
// In python-helpers.ts
if (process.env.VERCEL) {
  // Return mock data or skip Python analysis
}
```

---

### Issue 8: Build Timeout

**Error:**
```
Error: Build exceeded maximum duration of 45 minutes
```

**Solution:**
1. Reduce build complexity
2. Remove unnecessary dependencies
3. Use Vercel Pro for longer build times
4. Optimize `next.config.mjs`:
```js
const nextConfig = {
  // Reduce build time
  typescript: {
    ignoreBuildErrors: process.env.VERCEL_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

---

### Issue 9: Large Bundle Size

**Error:**
```
Warning: Bundle size exceeds recommended limit
```

**Solution:**
1. Check bundle analyzer:
```bash
npm install @next/bundle-analyzer
```

2. Add to `next.config.mjs`:
```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

3. Run: `ANALYZE=true npm run build:next`
4. Remove unused dependencies
5. Use dynamic imports for large components

---

### Issue 10: Vercel Function Size Limit

**Error:**
```
Error: Serverless Function size exceeds limit
```

**Solution:**
1. Move large dependencies to external APIs
2. Use Edge Runtime for smaller bundle:
```typescript
export const runtime = 'edge';
```

3. Split large API routes into smaller functions

---

## Debugging Steps

### 1. Test Build Locally
```bash
# Clean install
rm -rf node_modules .next
npm install

# Test build
npm run build:next

# Test production server
npm run start:next
```

### 2. Check Vercel Logs
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# View logs
vercel logs [deployment-url]
```

### 3. Enable Detailed Logging

Add to `next.config.mjs`:
```js
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};
```

### 4. Check Vercel Build Logs

1. Go to Vercel Dashboard
2. Click on your deployment
3. Click "Building" tab
4. Look for red error messages
5. Copy full error and search online

---

## Quick Fixes Checklist

- [ ] All environment variables set in Vercel
- [ ] Clerk URLs updated to production domain
- [ ] Convex deployed (`npm run convex:deploy`)
- [ ] Convex URL added to Vercel env vars
- [ ] Build works locally (`npm run build:next`)
- [ ] No TypeScript errors
- [ ] All dependencies in `package.json`
- [ ] API routes in `app/api/` directory
- [ ] Files named `route.ts` not `[name].ts`
- [ ] Latest code pushed to GitHub
- [ ] Vercel connected to correct branch (main)

---

## Still Having Issues?

**Share the following:**
1. Full error message from Vercel build logs
2. Screenshot of Vercel deployment error
3. Your Vercel project settings (Framework, Build Command, etc.)
4. Output of `npm run build:next` locally

**Vercel Support:**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/next.js/discussions
- Discord: https://nextjs.org/discord

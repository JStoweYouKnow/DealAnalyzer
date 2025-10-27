# Convex Backend Setup

This application now supports Convex as a backend database to replace the in-memory storage. Convex provides real-time data synchronization, TypeScript support, and automatic scaling.

## Setup Instructions

### 1. Install Convex CLI (if not already installed)
```bash
npm install -g convex
```

### 2. Initialize Convex Project
```bash
# Login to Convex (creates account if needed)
npx convex login

# Initialize Convex in your project
npx convex dev
```

This will:
- Create a Convex project
- Generate your `NEXT_PUBLIC_CONVEX_URL` 
- Start the Convex development server

### 3. Set Environment Variable
Add to your `.env.local` file:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your_deployment_name.convex.cloud
```

### 4. Run the Application
```bash
# Terminal 1: Start Convex dev server
npm run convex:dev

# Terminal 2: Start Next.js dev server  
npm run dev:next
```

## How It Works

### Automatic Backend Selection
The application automatically detects if Convex is configured:
- **With `NEXT_PUBLIC_CONVEX_URL`**: Uses Convex for persistent storage
- **Without it**: Falls back to in-memory storage (data lost on restart)

### Current Convex Implementation
✅ **Email Deals**: Fully implemented with Convex
- Create, read, update, delete email deals
- Gmail message ID preservation
- Content hash duplicate detection
- Bulk operations for email sync

✅ **Property Analyses**: Fully implemented with Convex
- Deal analysis CRUD operations
- Photo analysis storage
- Property comparisons

✅ **Hybrid Approach**: Other features use in-memory fallback
- Market intelligence data
- Saved filters and templates
- Search history

### Schema Overview
The Convex schema includes:
- `emailDeals`: Gmail-synced property deals
- `dealAnalyses`: Property investment analyses  
- `properties`: Property information
- `photoAnalyses`: AI photo scoring results
- `propertyComparisons`: Side-by-side comparisons
- `neighborhoodTrends`: Market intelligence
- `comparableSales`: Comparable property sales
- `marketHeatMapData`: Investment heat maps
- `savedFilters`: User-saved search filters
- `searchHistory`: Natural language search logs

## Benefits of Convex

1. **Real-time Updates**: Changes sync instantly across all clients
2. **Type Safety**: Full TypeScript support with generated types
3. **Automatic Scaling**: No database management required
4. **Offline Support**: Built-in offline capabilities
5. **ACID Transactions**: Consistent data operations
6. **Built-in Auth**: User authentication and permissions
7. **Edge Deployment**: Global edge network for low latency

## Development Commands

```bash
# Start Convex development server
npm run convex:dev

# Deploy to production
npm run convex:deploy

# Regenerate TypeScript types
npm run convex:codegen
```

## Migration Strategy

The current implementation uses a **hybrid approach**:

1. **Phase 1** (Current): Email deals use Convex, others use in-memory
2. **Phase 2** (Future): Migrate property analyses to Convex
3. **Phase 3** (Future): Migrate market intelligence to Convex
4. **Phase 4** (Future): Full Convex implementation

This allows for gradual migration while maintaining functionality.

## Troubleshooting

### Common Issues

1. **"ConvexHttpClient is not a constructor"**
   - Ensure `NEXT_PUBLIC_CONVEX_URL` is set correctly
   - Restart the Next.js dev server after adding the env var

2. **"Module not found: convex/_generated/api"**
   - Run `npm run convex:codegen` to generate types
   - Ensure Convex dev server is running

3. **Email deals not persisting**
   - Check if `NEXT_PUBLIC_CONVEX_URL` is set
   - Verify Convex dev server is running
   - Check browser console for Convex connection errors

### Logs
- Convex operations are logged to the browser console
- Storage backend selection is logged on server startup
- Look for "Using Convex storage backend" vs "Creating new MemStorage instance"

## Production Deployment

1. Deploy Convex functions:
   ```bash
   npm run convex:deploy
   ```

2. Update production environment variables:
   ```bash
   NEXT_PUBLIC_CONVEX_URL=https://your_production_deployment.convex.cloud
   ```

3. Deploy Next.js application as usual

The Convex deployment URL will be different for production vs development.

# Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or cloud equivalent)
- Google Cloud Project with these APIs enabled:
  - Google Analytics 4 API
  - Google Ads API
  - Google Search Console API
- OpenAI API key

## Step-by-Step Setup

### 1. Clone and Install

```bash
cd ecommerce-virtual-analyst
npm install
```

### 2. Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project

2. **Enable APIs**
   - Enable Google Analytics 4 API
   - Enable Google Ads API
   - Enable Google Search Console API

3. **Create Service Account** (for server-to-server authentication)
   - Create a service account
   - Download JSON key file
   - Save as `service-account-key.json`

4. **Setup OAuth 2.0** (for user authorization)
   - Create OAuth 2.0 credential (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret

5. **Link to Google Analytics & Ads**
   - Add service account email to GA property with appropriate permissions
   - Add service account to Google Ads account

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb analyst_db

# Set environment variable
export DATABASE_URL="postgresql://postgres:password@localhost:5432/analyst_db"
```

#### Option B: Vercel Postgres (Recommended)
1. Go to https://vercel.com/docs/storage/vercel-postgres
2. Create new project link
3. Copy database URL

#### Option C: Railway or Supabase
1. Create free PostgreSQL database
2. Copy connection string

### 4. Environment Configuration

Create `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_PROJECT_ID=your-project-id

# Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://yoursite.com

# Service Account
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
GOOGLE_SERVICE_ACCOUNT_EMAIL=analyst@project.iam.gserviceaccount.com
# Optional if you prefer inline JSON instead of a file path:
# GOOGLE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account",...}

# Database
DATABASE_URL=postgresql://user:password@host:5432/analyst_db

# OpenAI
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4
OPENAI_ORG_ID=org-xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=debug

# Scheduled Jobs
ENABLE_DAILY_SYNC=true
DAILY_SYNC_TIME=06:00
TIMEZONE=America/New_York

# Sync Configuration
DATA_SYNC_BATCH_SIZE=1000
DATA_SYNC_MAX_RETRIES=3
SYNC_SECRET_KEY=your-secret-key-for-manual-sync
```

For the live GA4 dashboard in `/dashboard`, make sure the service-account email has access to the GA4 property and `GOOGLE_ANALYTICS_PROPERTY_ID` matches that property exactly.

### 5. Initialize Database

```bash
npm run db:init
npm run db:migrate
```

### 6. Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000/dashboard

### 7. Manual Data Sync

Trigger a data sync manually:

```bash
curl -X POST http://localhost:3000/api/sync/trigger \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

Or run directly:

```bash
npm run sync:now
```

## Dashboard Features

### Key Metrics
- Total users and sessions
- Total transactions and revenue
- Average conversion rates
- Traffic source breakdown

### Traffic Analysis
- Users by traffic source (organic, paid, direct, etc.)
- Bounce rates by source
- Session duration
- Revenue attribution

### Category Performance
- Traffic volume by category
- Conversion rates by category
- Category-specific ROI
- Revenue by category

### AI Insights
- Automated analysis of performance
- Actionable recommendations
- Priority-based alerts
- Impact scoring

### Search Keywords
- Top performing keywords
- Keyword positions
- CTR analysis
- Optimization opportunities

## Scheduled Daily Sync

The system is designed to sync data daily at a scheduled time:

### Development (Local)
```bash
npm run sync:now
```

### Production (Vercel)

1. **Using Vercel Cron**:
   ```bash
   # Create vercel.json
   ```
   
   Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/sync/trigger",
       "schedule": "0 6 * * *"
     }]
   }
   ```

2. **External Scheduler** (AWS EventBridge, Google Cloud Scheduler):
   ```bash
   curl https://yourapp.vercel.app/api/sync/trigger \
     -H "Authorization: Bearer ${SYNC_SECRET_KEY}"
   ```

## API Endpoints

### Dashboard
- `GET /api/dashboard?date=2024-01-01` - Get daily dashboard data

### Data Fetch
- `GET /api/data/metrics?startDate=2024-01-01&endDate=2024-01-31&groupBy=traffic_source`
- `GET /api/data/keywords?startDate=2024-01-01&endDate=2024-01-31&limit=100`
- `GET /api/data/insights?date=2024-01-01&category=electronics&limit=50`

### Manual Sync
- `POST /api/sync/trigger` (requires Bearer token)

## Deployment to Vercel

```bash
# Build
npm run build

# Deploy
vercel deploy

# Or connect GitHub repo for automatic deploys
```

### Environment Variables on Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Google APIs Not Working
1. Verify API is enabled in Google Cloud Console
2. Check service account has correct permissions
3. Verify tokens are not expired
4. Check OAuth redirect URIs

### No Data Showing in Dashboard
1. Run `npm run sync:now` to fetch data
2. Check data_sync_logs table for errors
3. Verify API credentials are correct
4. Check network requests in browser dev tools

### OpenAI Insights Not Generating
1. Verify OPENAI_API_KEY is set correctly
2. Check OpenAI account has credits
3. Verify organization ID is correct
4. Check CloudWatch/logs for API errors

## Next Steps

1. **Connect to Your Website**
   - Verify Google Analytics is tracking your site
   - Add conversion tracking
   - Setup goal tracking in GA

2. **Customize Dashboard**
   - Add more custom metrics
   - Create custom reports
   - Setup alerts/notifications

3. **Integrate with Tools**
   - Send insights to Slack
   - Export reports to email
   - Connect to CRM systems

4. **Scale for Production**
   - Setup error monitoring (Sentry)
   - Configure logging (LogRocket)
   - Setup alerting system
   - Configure backups

## Support

For issues or questions:
- Check DATABASE.md for database-specific help
- Review error logs in /jobs directory
- Check API responses in browser dev tools
- Verify environment variables are set correctly

## Security Notes

- **Never commit `.env.local`** - it's in .gitignore
- Keep API keys secure
- Use service accounts for server-to-server auth
- Rotate API keys periodically
- Use strong database passwords
- Enable SSL/TLS for database connections

## Performance Tips

1. Database optimization: Add indexes for custom queries
2. Cache results: Use Redis for frequently accessed data
3. Batch processing: Process data in chunks
4. Async jobs: Use async for long-running operations
5. Monitor: Track query performance and API response times

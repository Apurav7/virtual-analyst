# Ecommerce Virtual Data Analyst

An AI-powered virtual analyst dashboard for ecommerce websites that measures user performance from organic search and paid ads, analyzing traffic, conversion, engagement, and user journeys with daily AI-generated insights.

## Features

- **Multi-Source Data Integration**: Google Analytics 4, Google Ads, Google Search Console
- **User Journey Tracking**: Track how users move through your site from different traffic sources
- **Performance Metrics**: Traffic source comparison, conversion rates by category, engagement metrics
- **AI-Powered Insights**: OpenAI-powered analysis with actionable recommendations
- **Daily Dashboard**: Easy-to-view dashboard with morning data snapshots
- **Category Analysis**: Identify which categories need improvement, have traffic, and convert

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript & React
- **Backend**: Next.js API Routes + Node.js
- **Database**: PostgreSQL (for historical data & aggregations)
- **AI**: OpenAI API (GPT-4)
- **Deployment**: Cloud Run or Vercel
- **Data Sources**: Google APIs (Analytics, Ads, Search Console)

## Project Structure

```
ecommerce-virtual-analyst/
├── app/                          # Next.js app directory
│   ├── api/
│   │   ├── webhooks/            # Webhook endpoints
│   │   ├── data/                # Data fetching endpoints
│   │   └── insights/            # AI insights endpoints
│   ├── dashboard/               # Dashboard pages
│   ├── settings/                # Configuration pages
│   └── layout.tsx
├── lib/
│   ├── connectors/              # External API connectors
│   │   ├── ga-connector.ts
│   │   ├── ads-connector.ts
│   │   └── search-console-connector.ts
│   ├── db/                      # Database utilities
│   │   ├── schema.sql
│   │   └── client.ts
│   ├── ai/                      # AI insights engine
│   │   └── insights-generator.ts
│   ├── aggregation/             # Data processing & aggregation
│   │   ├── analytics-processor.ts
│   │   └── metrics-calculator.ts
│   ├── services/                # Business logic
│   │   ├── data-sync.service.ts
│   │   └── report-service.ts
│   └── utils/                   # Utilities
│       ├── formatters.ts
│       └── date-helpers.ts
├── components/                  # React components
│   ├── Dashboard/
│   ├── Charts/
│   ├── Insights/
│   └── Settings/
├── styles/                      # Global styles
├── public/                       # Static assets
├── jobs/                        # Scheduled jobs
│   └── daily-data-sync.ts
├── .env.example                 # Example environment variables
├── .env.local                   # Local environment (git ignored)
├── package.json
├── tsconfig.json
├── next.config.js
└── DATABASE.md                  # Database setup guide
```

## Setup & Installation

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Project with APIs enabled:
  - Google Analytics 4 API
  - Google Ads API
  - Google Search Console API
- OpenAI API key

### 2. Clone & Install

```bash
git clone <repo>
cd ecommerce-virtual-analyst
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# Google APIs
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_ANALYTICS_PROPERTY_ID=your_ga4_property_id
GOOGLE_ADS_CUSTOMER_ID=your_ads_customer_id
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://yoursite.com

# Service account used by the live GA4 dashboard
GOOGLE_SERVICE_ACCOUNT_KEY=/absolute/path/to/service-account-key.json
GOOGLE_SERVICE_ACCOUNT_EMAIL=analyst@project.iam.gserviceaccount.com
GOOGLE_PROJECT_ID=your_google_project_id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/analyst_db

# OpenAI
OPENAI_API_KEY=your_openai_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

```bash
npm run db:init
npm run db:migrate
```

### 5. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000/dashboard`

### Live GA4 Dashboard Setup

The dashboard now reads directly from GA4 for the date-range overview and natural-language analytics queries.

1. Enable the Google Analytics Data API in your Google Cloud project.
2. For local use, either run `gcloud auth application-default login` or create a service account.
3. For Cloud Run, attach a service account to the service instead of downloading a JSON key.
4. Add the Google identity you use to the GA4 property with at least Viewer access.
5. Set `GOOGLE_ANALYTICS_PROPERTY_ID` and `GOOGLE_PROJECT_ID` in `.env.local`.

Once configured, the dashboard can answer questions such as users from Delhi yesterday, top cities by users, and cities driving purchases.

## Data Flow

```
Google Ads ──┐
             ├──→ API Connectors ──→ Data Aggregation ──→ PostgreSQL ──┐
GA4 ────────┤                                                          ├──→ Dashboard UI
Search Con. ┘                                                          │
                                                                       └──→ AI Insights
```

## Daily Sync Schedule

The virtual analyst runs a daily job that:
1. Fetches data from all sources (GA, Ads, Search Console)
2. Processes and aggregates metrics by traffic source, category, user journey
3. Calculates performance indicators and trends
4. Generates AI-powered insights using OpenAI
5. Stores results in database
6. Updates the dashboard

## Key Metrics Tracked

- **Traffic Source Performance**: Organic vs Paid comparison
- **User Journey**: Session flow, page sequences
- **Conversion Metrics**: By category, by traffic source
- **Engagement**: Time on page, bounce rate, scroll depth
- **ROI**: Cost per conversion by source/category
- **Trend Analysis**: Day-over-day, week-over-week changes

## AI Insights Generated

- Category health assessment with recommendations
- Traffic source efficiency analysis
- User behavior patterns and anomalies
- Conversion optimization opportunities
- Content performance insights
- Seasonal trend analysis

## Deployment to Cloud Run

This repo is now configured for Cloud Run with:
- standalone Next.js output in [next.config.js](c:/Users/apura/OneDrive/Documents/VS%20Projects/ecommerce-virtual-analyst/next.config.js)
- container image build in [Dockerfile](c:/Users/apura/OneDrive/Documents/VS%20Projects/ecommerce-virtual-analyst/Dockerfile)
- Cloud Build upload filtering in [.gcloudignore](c:/Users/apura/OneDrive/Documents/VS%20Projects/ecommerce-virtual-analyst/.gcloudignore)

### 1. Create a runtime service account

Create a Google service account that Cloud Run will use at runtime. Grant it:
- access to the GA4 property in GA Admin
- any database or secret access your app needs

Example:

```bash
gcloud iam service-accounts create ecommerce-virtual-analyst \
  --display-name="Ecommerce Virtual Analyst"
```

### 2. Set required environment variables

At minimum for the live GA4 dashboard:

```env
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_PROJECT_ID=your-gcp-project-id
NEXT_PUBLIC_APP_URL=https://your-service-url.run.app
OPENAI_API_KEY=your-openai-key
DATABASE_URL=your-postgres-connection-string
SYNC_SECRET_KEY=choose-a-long-random-secret
CRON_SECRET=choose-a-long-random-secret
```

Do not set `GOOGLE_SERVICE_ACCOUNT_KEY` on Cloud Run when you are using the attached runtime service account.

### 3. Deploy

Replace the placeholders and run:

```bash
gcloud run deploy ecommerce-virtual-analyst \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --service-account ecommerce-virtual-analyst@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_ANALYTICS_PROPERTY_ID=YOUR_GA4_PROPERTY_ID,GOOGLE_PROJECT_ID=YOUR_PROJECT_ID,NEXT_PUBLIC_APP_URL=https://ecommerce-virtual-analyst-xxxxx-uc.a.run.app,OPENAI_API_KEY=YOUR_OPENAI_KEY,DATABASE_URL=YOUR_DATABASE_URL,SYNC_SECRET_KEY=YOUR_SYNC_SECRET,CRON_SECRET=YOUR_CRON_SECRET
```

If you prefer not to place secrets directly in the command, store them in Secret Manager and attach them to the service.

### 4. Verify

After deployment:
1. Open `/dashboard`
2. Confirm the source table loads live GA4 data
3. Run a natural-language query like `Top cities from where I am getting users`

### 5. Trigger scheduled syncs

Cloud Run does not use the Vercel cron config. Use Cloud Scheduler to call `/api/cron/daily-sync` with the `Authorization: Bearer YOUR_CRON_SECRET` header.

## Deployment to Vercel

```bash
npm run build
vercel deploy
```

Configure environment variables in Vercel dashboard. The live GA4 routes on Vercel still require a usable Google credential source; Cloud Run is the recommended deployment target when your org blocks service-account key creation.

## Database Schema Overview

Key tables:
- `daily_metrics`: Aggregated metrics by date, source, category
- `user_journeys`: Session flow and page sequences
- `category_performance`: Category-level KPIs
- `ai_insights`: Generated insights with timestamps
- `data_sync_logs`: Track data fetch success/failures

See [DATABASE.md](./DATABASE.md) for complete schema.

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit PR

## License

MIT

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
- **Deployment**: Vercel
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
GOOGLE_ANALYTICS_ID=your_ga_property_id
GOOGLE_ADS_CUSTOMER_ID=your_ads_customer_id
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://yoursite.com

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

## Deployment to Vercel

```bash
npm run build
vercel deploy
```

Configure environment variables in Vercel dashboard.

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

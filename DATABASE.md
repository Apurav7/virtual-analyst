# Database Setup Guide

## Creating the Database

### Option 1: Local PostgreSQL

```bash
# Create database
createdb analyst_db

# Set connection string
export DATABASE_URL="postgresql://postgres:password@localhost:5432/analyst_db"
```

### Option 2: Docker

```bash
docker run -d \
  --name analyst-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=analyst_db \
  -p 5432:5432 \
  postgres:15-alpine

export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/analyst_db"
```

### Option 3: Cloud Database (Recommended for Production)

- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Railway**: https://railway.app (free tier available)
- **Supabase**: https://supabase.com (PostgreSQL compatible)
- **AWS RDS**: AWS-managed PostgreSQL
- **Google Cloud SQL**: Google-managed PostgreSQL

## Initialize Schema

```bash
npm run db:init
```

This will run the schema from `lib/db/schema.ts` and create all tables.

## Tables Overview

### `daily_metrics`
Aggregated metrics by date and traffic source. Main table for dashboard metrics.
- **Key Fields**: date, traffic_source, category, users, sessions, transactions, revenue, conversion_rate, cost, roas
- **Updates**: Daily sync job
- **Query Pattern**: GROUP BY date, traffic_source for historical trends

### `category_performance`
Category-level KPIs aggregated by traffic source.
- **Key Fields**: date, category, traffic_source, traffic_volume, conversion_rate, customer_acquisition_cost, roas
- **Updates**: Daily during aggregation
- **Query Pattern**: Filter by category to analyze category health

### `user_journeys`
Individual session data for user flow analysis.
- **Key Fields**: session_id, user_id, traffic_source, landing_page, page_sequence, converted, revenue
- **Updates**: Real-time or batch from GA
- **Query Pattern**: Analyze user paths and funnel analysis

### `search_keywords`
Search performance data from Google Search Console.
- **Key Fields**: date, keyword, impressions, clicks, ctr, avg_position
- **Updates**: Daily from Search Console API
- **Query Pattern**: Find keyword opportunities, position improvements

### `page_performance`
Page-level engagement and conversion metrics.
- **Key Fields**: date, page_path, category, pageviews, avg_time_on_page, conversion_count, revenue
- **Updates**: Daily from GA
- **Query Pattern**: Identify top/underperforming pages

### `ai_insights`
AI-generated insights and recommendations.
- **Key Fields**: date, insight_type, category, title, insight_text, recommendation, priority, impact_score
- **Updates**: After daily sync completes
- **Query Pattern**: Show top insights on dashboard, filter by priority

### `data_sync_logs`
Logs of all data sync operations for troubleshooting.
- **Key Fields**: sync_date, source, status, records_fetched, error_message, duration_ms
- **Updates**: After each sync attempt
- **Query Pattern**: Monitor sync health, debugging

## Querying Examples

### Get traffic metrics for last 30 days
```sql
SELECT date, traffic_source, SUM(users) as users, SUM(revenue) as revenue
FROM daily_metrics
WHERE date >= NOW() - INTERVAL '30 days'
GROUP BY date, traffic_source
ORDER BY date DESC;
```

### Get conversion rates by category
```sql
SELECT category, traffic_source, AVG(conversion_rate) as avg_ctr, SUM(transactions) as total_transactions
FROM daily_metrics
WHERE date >= NOW() - INTERVAL '7 days'
GROUP BY category, traffic_source
ORDER BY avg_ctr DESC;
```

### Get top 10 keywords with low CTR (optimization opportunities)
```sql
SELECT keyword, impressions, clicks, ctr, avg_position
FROM search_keywords
WHERE impressions > 100 AND ctr < 5
ORDER BY impressions DESC
LIMIT 10;
```

### Get top AI insights for today
```sql
SELECT title, insight_text, recommendation, priority, impact_score
FROM ai_insights
WHERE date = CURRENT_DATE
ORDER BY impact_score DESC
LIMIT 10;
```

## Indexing Strategy

The schema includes indexes on frequently queried columns:
- date (most common filter)
- traffic_source (for source comparison)
- category (for category analysis)
- converted (for conversion funnel)

### Adding Custom Indexes

```sql
-- For custom analysis queries
CREATE INDEX idx_daily_metrics_revenue ON daily_metrics(date, revenue DESC);
CREATE INDEX idx_journeys_landing_page ON user_journeys(traffic_source, landing_page);
```

## Backup Strategy

### Automated Backups
- **Vercel Postgres**: Automated daily backups included
- **Supabase**: Daily backups at 12 AM UTC
- **AWS RDS**: Enable automated backups (7-35 days retention)

### Manual Backup

```bash
pg_dump postgresql://user:password@host/analyst_db > backup.sql
```

### Restore from Backup

```bash
psql postgresql://user:password@host/analyst_db < backup.sql
```

## Performance Optimization

### Connection Pooling
The app uses pg pool with:
- Max 20 connections
- 30 second idle timeout
- 2 second connection timeout

### Query Optimization Tips
1. Always filter by date range in WHERE clause
2. Use aggregation (SUM, AVG) to reduce result set size
3. Limit results with LIMIT clause
4. Use indexes on frequently filtered columns
5. Consider materialized views for complex aggregations

### Example Optimized Query
```sql
-- Good: filtered by date, indexed columns, limited results
SELECT traffic_source, SUM(revenue) as revenue
FROM daily_metrics
WHERE date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE
GROUP BY traffic_source
ORDER BY revenue DESC
LIMIT 50;

-- Bad: full table scan, unfiltered
SELECT * FROM daily_metrics;
```

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection limits
SELECT count(*) FROM pg_stat_activity;
```

### Slow Queries
```sql
-- Find slow queries
SELECT query, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Disk Space
```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size DESC;
```

## Migration to Production Database

1. **Create production database** (AWS RDS, Supabase, etc.)
2. **Update DATABASE_URL** in Vercel environment variables
3. **Run schema initialization**: `npm run db:init`
4. **Migrate historical data** (if needed):
   ```bash
   pg_dump $LOCAL_DATABASE_URL | psql $PROD_DATABASE_URL
   ```
5. **Verify connectivity** and run tests
6. **Enable backups** and monitoring

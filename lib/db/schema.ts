/**
 * PostgreSQL Database Schema
 * Run this to initialize the database
 */

export const SCHEMA = `
-- Daily Metrics Table (main aggregation)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  traffic_source VARCHAR(100) NOT NULL,
  category VARCHAR(255),
  users INT DEFAULT 0,
  sessions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  bounce_rate FLOAT DEFAULT 0,
  avg_session_duration FLOAT DEFAULT 0,
  transactions INT DEFAULT 0,
  revenue FLOAT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,
  cost FLOAT DEFAULT 0,
  roas FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, traffic_source, category)
);

-- Category Performance Table
CREATE TABLE IF NOT EXISTS category_performance (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  category VARCHAR(255) NOT NULL,
  traffic_source VARCHAR(100) NOT NULL,
  traffic_volume INT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,
  avg_order_value FLOAT DEFAULT 0,
  total_revenue FLOAT DEFAULT 0,
  customer_acquisition_cost FLOAT DEFAULT 0,
  roas FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, category, traffic_source)
);

-- User Journey Table
CREATE TABLE IF NOT EXISTS user_journeys (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  traffic_source VARCHAR(100) NOT NULL,
  landing_page VARCHAR(512) NOT NULL,
  page_sequence TEXT NOT NULL,
  event_sequence TEXT NOT NULL,
  session_duration INT DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE,
  revenue FLOAT DEFAULT 0,
  pages_visited INT DEFAULT 0,
  session_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_traffic_source (traffic_source),
  INDEX idx_converted (converted),
  INDEX idx_session_date (session_date)
);

-- Search Keywords Table
CREATE TABLE IF NOT EXISTS search_keywords (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  keyword VARCHAR(512) NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  avg_position FLOAT DEFAULT 0,
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, keyword)
);

-- Page Performance Table
CREATE TABLE IF NOT EXISTS page_performance (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  page_path VARCHAR(512) NOT NULL,
  category VARCHAR(255),
  pageviews INT DEFAULT 0,
  unique_pageviews INT DEFAULT 0,
  avg_time_on_page INT DEFAULT 0,
  bounce_rate FLOAT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  revenue FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, page_path)
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  insight_type VARCHAR(100) NOT NULL,
  category VARCHAR(255),
  title VARCHAR(512) NOT NULL,
  insight_text TEXT NOT NULL,
  recommendation TEXT,
  metric_value FLOAT,
  metric_change FLOAT,
  priority VARCHAR(50),
  impact_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Sync Logs Table
CREATE TABLE IF NOT EXISTS data_sync_logs (
  id SERIAL PRIMARY KEY,
  sync_date DATE NOT NULL,
  source VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  records_fetched INT DEFAULT 0,
  records_processed INT DEFAULT 0,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_source ON daily_metrics(traffic_source);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_category ON daily_metrics(category);
CREATE INDEX IF NOT EXISTS idx_category_perf_date ON category_performance(date);
CREATE INDEX IF NOT EXISTS idx_category_perf_category ON category_performance(category);
CREATE INDEX IF NOT EXISTS idx_search_keywords_date ON search_keywords(date);
CREATE INDEX IF NOT EXISTS idx_page_perf_date ON page_performance(date);
CREATE INDEX IF NOT EXISTS idx_ai_insights_date ON ai_insights(date);
CREATE INDEX IF NOT EXISTS idx_sync_logs_date ON data_sync_logs(sync_date);
`;

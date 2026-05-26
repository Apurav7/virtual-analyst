'use client';

import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface OverviewMetricSummary {
  users: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  purchases: number;
}

interface OverviewRow {
  source?: string;
  city?: string;
  users: number;
  pageViews: number;
  avgSessionDuration?: number;
  bounceRate?: number;
  purchases: number;
}

interface OverviewResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: OverviewMetricSummary;
  bySource: OverviewRow[];
  topCities: OverviewRow[];
}

interface QueryChart {
  xKey: string;
  metricKey: string;
  label: string;
}

interface QueryResponse {
  answer: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  chart: QueryChart | null;
}

const exampleQueries = [
  'How many users came from Delhi yesterday, and what was their bounce rate?',
  'Top cities from where I am getting users',
  'From which city am I getting purchases?',
  'Which traffic source gave me the most page views in the last 7 days?',
];

function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value || 0));
}

function formatPercent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

function formatDuration(value: number) {
  const totalSeconds = Math.round(value || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatCellValue(column: string, value: string | number | undefined) {
  if (value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (column.toLowerCase().includes('bounce rate')) {
    return formatPercent(value);
  }

  if (column.toLowerCase().includes('duration')) {
    return formatDuration(value);
  }

  return formatNumber(value);
}

export default function DashboardPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return formatDateInput(date);
  });
  const [endDate, setEndDate] = useState(() => formatDateInput(new Date()));
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [question, setQuestion] = useState(exampleQueries[0]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      try {
        setOverviewLoading(true);
        setOverviewError(null);

        const response = await fetch(
          `/api/ga4/overview?startDate=${startDate}&endDate=${endDate}`,
          { signal: controller.signal }
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || payload.error || 'Failed to load GA4 overview');
        }

        setOverview(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        setOverviewError(error instanceof Error ? error.message : 'Failed to load GA4 overview');
      } finally {
        setOverviewLoading(false);
      }
    }

    loadOverview();

    return () => controller.abort();
  }, [startDate, endDate]);

  async function handleAskQuestion(nextQuestion?: string) {
    const prompt = (nextQuestion || question).trim();

    if (!prompt) {
      setQueryError('Enter a question to query GA4 data.');
      return;
    }

    try {
      setQueryLoading(true);
      setQueryError(null);

      const response = await fetch('/api/ga4/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: prompt,
          startDate,
          endDate,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || payload.error || 'Failed to query GA4');
      }

      setQuestion(prompt);
      setQueryResult(payload);
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'Failed to query GA4');
    } finally {
      setQueryLoading(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Live GA4 dashboard</p>
          <h1>Traffic, engagement, and city-level answers from Google Analytics 4</h1>
          <p className="hero-copy">
            This dashboard reads directly from GA4, shows last 7 day source-wise performance by default,
            and lets you ask analytics questions in natural language.
          </p>
        </div>
        <div className="date-panel card">
          <label>
            <span>Start date</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="date-input" />
          </label>
          <label>
            <span>End date</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="date-input" />
          </label>
          <p className="date-hint">Default range is the last 7 days. Natural-language questions reuse this range unless you ask for yesterday, today, or another last-N-days window.</p>
        </div>
      </section>

      {overviewError && (
        <div className="alert alert-danger">
          <strong>GA4 setup required.</strong> {overviewError}
          <div className="setup-list">
            <span>1. Create a Google service account with GA4 Data API access.</span>
            <span>2. Add the service-account email to your GA4 property as a Viewer or Analyst.</span>
            <span>3. Set GOOGLE_ANALYTICS_PROPERTY_ID and GOOGLE_SERVICE_ACCOUNT_KEY in .env.local.</span>
          </div>
        </div>
      )}

      {overviewLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading live GA4 overview...</p>
        </div>
      ) : overview ? (
        <div className="dashboard-content">
          <section className="dashboard-section">
            <div className="grid grid-cols-4">
              <div className="card stat-card">
                <span className="metric-label">Users</span>
                <strong className="metric-value">{formatNumber(overview.summary.users)}</strong>
              </div>
              <div className="card stat-card">
                <span className="metric-label">Page views</span>
                <strong className="metric-value">{formatNumber(overview.summary.pageViews)}</strong>
              </div>
              <div className="card stat-card">
                <span className="metric-label">Avg session duration</span>
                <strong className="metric-value">{formatDuration(overview.summary.avgSessionDuration)}</strong>
              </div>
              <div className="card stat-card">
                <span className="metric-label">Bounce rate</span>
                <strong className="metric-value">{formatPercent(overview.summary.bounceRate)}</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-section split-layout">
            <div className="card chart-card">
              <div className="section-heading">
                <h2>Users by source</h2>
                <p>Last 7 days by default. Switch the date range above to change the window.</p>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={overview.bySource}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8d1c7" />
                    <XAxis dataKey="source" stroke="#5f5347" tickLine={false} axisLine={false} />
                    <YAxis stroke="#5f5347" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#d97b2d" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card query-card">
              <div className="section-heading">
                <h2>Ask GA4 in plain English</h2>
                <p>Examples: users from Delhi yesterday, top cities, city-wise purchases, or source-wise page views.</p>
              </div>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="question-input"
                rows={5}
                placeholder="Ask a GA4 question..."
              />
              <div className="example-list">
                {exampleQueries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="example-chip"
                    onClick={() => {
                      setQuestion(item);
                      void handleAskQuestion(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button type="button" className="button button-primary ask-button" onClick={() => void handleAskQuestion()} disabled={queryLoading}>
                {queryLoading ? 'Querying GA4...' : 'Ask question'}
              </button>
              {queryError && <div className="alert alert-danger query-alert">{queryError}</div>}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="card">
              <div className="section-heading">
                <h2>Source-wise performance</h2>
                <p>Users, page views, average session duration, bounce rate, and purchases for the selected date range.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Users</th>
                      <th>Page views</th>
                      <th>Avg session duration</th>
                      <th>Bounce rate</th>
                      <th>Purchases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.bySource.map((row) => (
                      <tr key={row.source}>
                        <td>{row.source || 'Unassigned'}</td>
                        <td>{formatNumber(row.users)}</td>
                        <td>{formatNumber(row.pageViews)}</td>
                        <td>{formatDuration(row.avgSessionDuration || 0)}</td>
                        <td>{formatPercent(row.bounceRate || 0)}</td>
                        <td>{formatNumber(row.purchases)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="dashboard-section split-layout bottom-layout">
            <div className="card">
              <div className="section-heading">
                <h2>Top cities</h2>
                <p>City-wise user and purchase signals from GA4.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Users</th>
                      <th>Page views</th>
                      <th>Purchases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.topCities.map((row) => (
                      <tr key={row.city}>
                        <td>{row.city || 'Unknown'}</td>
                        <td>{formatNumber(row.users)}</td>
                        <td>{formatNumber(row.pageViews)}</td>
                        <td>{formatNumber(row.purchases)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card query-results-card">
              <div className="section-heading">
                <h2>Answer output</h2>
                <p>The dashboard maps your wording to GA4 dimensions and metrics, then renders the result.</p>
              </div>
              {queryResult ? (
                <>
                  <div className="answer-banner">{queryResult.answer}</div>
                  {queryResult.chart && queryResult.rows.length > 1 && (
                    <div className="chart-wrap small-chart">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={queryResult.rows}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8d1c7" />
                          <XAxis dataKey={queryResult.chart.xKey} stroke="#5f5347" tickLine={false} axisLine={false} />
                          <YAxis stroke="#5f5347" tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey={queryResult.chart.metricKey} fill="#215f5b" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {queryResult.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, index) => (
                          <tr key={`${index}-${queryResult.columns[0] || 'row'}`}>
                            {queryResult.columns.map((column) => (
                              <td key={column}>{formatCellValue(column, row[column])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  Ask one of the sample questions to see city-level or source-level GA4 results here.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .dashboard-shell {
          max-width: 1380px;
          margin: 0 auto;
          padding-bottom: 48px;
        }

        .hero-panel {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr;
          gap: 24px;
          margin-bottom: 28px;
          padding: 28px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(217, 123, 45, 0.22), transparent 36%),
            linear-gradient(135deg, #f3ede4 0%, #e6dccd 48%, #d6c7b5 100%);
          box-shadow: 0 24px 48px rgba(82, 63, 41, 0.14);
        }

        .eyebrow {
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.74rem;
          font-weight: 700;
          color: #8d5226;
        }

        .hero-panel h1 {
          max-width: 12ch;
          margin-bottom: 14px;
          font-size: clamp(2.4rem, 5vw, 4rem);
          line-height: 0.96;
          color: #2f241a;
        }

        .hero-copy {
          max-width: 58ch;
          font-size: 1rem;
          line-height: 1.7;
          color: #4a3d33;
        }

        .date-panel {
          display: grid;
          gap: 16px;
          align-content: start;
          border: 1px solid rgba(77, 58, 40, 0.08);
          background: rgba(255, 252, 247, 0.88);
        }

        .date-panel label {
          display: grid;
          gap: 8px;
          font-weight: 600;
          color: #43352a;
        }

        .date-panel span {
          font-size: 0.9rem;
        }

        .date-hint {
          font-size: 0.88rem;
          line-height: 1.6;
          color: #6b5b4d;
        }

        .stat-card {
          min-height: 148px;
          border: 1px solid rgba(82, 63, 41, 0.08);
          background: linear-gradient(180deg, #fffdf8 0%, #f6efe5 100%);
        }

        .split-layout {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 24px;
        }

        .bottom-layout {
          align-items: start;
        }

        .section-heading {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
        }

        .section-heading p {
          color: #6f6358;
          line-height: 1.5;
        }

        .chart-card,
        .query-card,
        .query-results-card {
          min-height: 100%;
        }

        .chart-wrap {
          width: 100%;
          min-height: 320px;
        }

        .small-chart {
          min-height: 240px;
          margin-bottom: 8px;
        }

        .question-input {
          width: 100%;
          border: 1px solid #d6c5b1;
          border-radius: 16px;
          padding: 16px;
          font: inherit;
          line-height: 1.6;
          resize: vertical;
          background: #fffdf8;
        }

        .question-input:focus {
          outline: none;
          border-color: #d97b2d;
          box-shadow: 0 0 0 4px rgba(217, 123, 45, 0.12);
        }

        .example-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .example-chip {
          border-radius: 999px;
          border: 1px solid #d6c5b1;
          background: #fff7ed;
          color: #6c4a2d;
          padding: 10px 14px;
          text-align: left;
          font-size: 0.86rem;
        }

        .example-chip:hover {
          border-color: #d97b2d;
          background: #ffe8cf;
        }

        .ask-button {
          margin-top: 16px;
          width: fit-content;
          background: linear-gradient(135deg, #d97b2d 0%, #bb5f20 100%);
        }

        .ask-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #c56b22 0%, #9e4f1a 100%);
        }

        .table-wrap {
          overflow-x: auto;
        }

        .answer-banner {
          margin-bottom: 16px;
          padding: 14px 16px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ecf6f1 0%, #dff1ea 100%);
          color: #18423e;
          font-weight: 600;
          line-height: 1.6;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 220px;
          border: 1px dashed #d6c5b1;
          border-radius: 16px;
          color: #6f6358;
          text-align: center;
          line-height: 1.6;
          padding: 20px;
        }

        .setup-list {
          display: grid;
          gap: 6px;
          margin-top: 10px;
          font-size: 0.92rem;
        }

        .query-alert {
          margin-top: 16px;
          margin-bottom: 0;
        }

        @media (max-width: 1100px) {
          .hero-panel,
          .split-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .hero-panel {
            padding: 22px;
          }

          .hero-panel h1 {
            max-width: none;
          }

          .dashboard-shell {
            padding-bottom: 28px;
          }
        }
      `}</style>
    </div>
  );
}

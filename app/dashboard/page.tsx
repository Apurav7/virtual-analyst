'use client';

import React, { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard?date=${date}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Load last sync time from localStorage
    const savedSyncTime = localStorage.getItem('lastSyncTime');
    if (savedSyncTime) {
      setLastSyncTime(savedSyncTime);
    }
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleRefresh = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      
      const response = await fetch('/api/sync/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SYNC_KEY || 'dev-key'}`
        }
      });

      if (!response.ok) {
        throw new Error('Sync request failed');
      }

      await response.json();
      const syncTime = new Date().toLocaleString();
      setLastSyncTime(syncTime);
      localStorage.setItem('lastSyncTime', syncTime);
      setSyncMessage('✅ Data synced successfully! Refresh the page to see latest data.');
      
      // Auto-refresh dashboard data after sync
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setSyncMessage(`❌ Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img src="https://www.farmlokal.com/logo.png" alt="Farmlokal" className="logo" />
            <div className="header-text">
              <h1>🎯 Virtual Data Analyst</h1>
              <p>AI-Powered Ecommerce Analytics for Farmlokal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="controls">
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="date-input"
        />
        <button 
          onClick={handleRefresh}
          disabled={syncing}
          className="button button-primary"
          title="Fetch latest data from Google APIs"
        >
          {syncing ? '🔄 Syncing...' : '🔄 Refresh Data'}
        </button>
        {lastSyncTime && (
          <div className="sync-status">
            Last synced: {lastSyncTime}
          </div>
        )}
      </div>

      {syncMessage && (
        <div className={`alert ${syncMessage.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          {syncMessage}
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : dashboardData ? (
        <div className="dashboard-content">
          {/* Key Metrics Section */}
          <section className="dashboard-section">
            <h2>📊 Key Metrics</h2>
            <div className="grid grid-cols-4">
              <div className="card metric-card">
                <div className="metric-label">Total Users</div>
                <div className="metric-value">
                  {dashboardData.metrics?.reduce((sum: number, m: any) => sum + (m.users || 0), 0) || 0}
                </div>
              </div>
              <div className="card metric-card">
                <div className="metric-label">Total Transactions</div>
                <div className="metric-value">
                  {dashboardData.metrics?.reduce((sum: number, m: any) => sum + (m.transactions || 0), 0) || 0}
                </div>
              </div>
              <div className="card metric-card">
                <div className="metric-label">Total Revenue</div>
                <div className="metric-value">
                  ${(
                    dashboardData.metrics?.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) || 0
                  ).toFixed(2)}
                </div>
              </div>
              <div className="card metric-card">
                <div className="metric-label">Avg Conversion Rate</div>
                <div className="metric-value">
                  {(
                    dashboardData.metrics?.reduce((sum: number, m: any) => sum + (m.conversion_rate || 0), 0) /
                      (dashboardData.metrics?.length || 1) || 0
                  ).toFixed(2)}
                  %
                </div>
              </div>
            </div>
          </section>

          {/* Traffic Source Breakdown */}
          <section className="dashboard-section">
            <h2>🔍 Traffic by Source</h2>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Traffic Source</th>
                    <th>Users</th>
                    <th>Sessions</th>
                    <th>Bounce Rate</th>
                    <th>Avg Duration</th>
                    <th>Transactions</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.metrics?.length > 0 ? (
                    dashboardData.metrics.map((metric: any, idx: number) => (
                      <tr key={idx}>
                        <td className="source-badge">{metric.traffic_source}</td>
                        <td>{metric.users || 0}</td>
                        <td>{metric.sessions || 0}</td>
                        <td>{(metric.bounce_rate || 0).toFixed(2)}%</td>
                        <td>{((metric.avg_session_duration || 0) / 60).toFixed(1)}m</td>
                        <td>{metric.transactions || 0}</td>
                        <td>${(metric.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* AI Insights */}
          <section className="dashboard-section">
            <h2>💡 AI-Powered Insights</h2>
            <div className="insights-grid">
              {dashboardData.insights?.length > 0 ? (
                dashboardData.insights.map((insight: any, idx: number) => (
                  <div key={idx} className="card insight-card">
                    <div className="insight-header">
                      <h3>{insight.title}</h3>
                      <span className={`priority-badge priority-${insight.priority}`}>{insight.priority}</span>
                    </div>
                    <p className="insight-text">{insight.insight_text}</p>
                    <div className="insight-recommendation">
                      <strong>✅ Recommendation:</strong> {insight.recommendation}
                    </div>
                    <div className="insight-impact">Impact Score: {insight.impact_score}/100</div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <p style={{ color: '#999' }}>Insights will be available after the daily sync completes</p>
                </div>
              )}
            </div>
          </section>

          {/* Top Keywords */}
          <section className="dashboard-section">
            <h2>🔑 Top Search Keywords</h2>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Avg Position</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.keywords?.length > 0 ? (
                    dashboardData.keywords.slice(0, 15).map((keyword: any, idx: number) => (
                      <tr key={idx}>
                        <td>{keyword.keyword}</td>
                        <td>{keyword.impressions || 0}</td>
                        <td>{keyword.clicks || 0}</td>
                        <td>{(keyword.ctr || 0).toFixed(2)}%</td>
                        <td>{(keyword.avg_position || 0).toFixed(1)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>
                        No keyword data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%);
          color: white;
          padding: 40px 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }

        .dashboard-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .dashboard-header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .controls {
          margin-bottom: 30px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .date-input {
          padding: 10px 15px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
        }

        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .button-primary {
          background-color: var(--primary-color);
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          background-color: #0052a3;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sync-status {
          font-size: 0.9rem;
          color: #666;
          padding: 10px 15px;
          background-color: #f0f0f0;
          border-radius: 6px;
          white-space: nowrap;
        }

        .dashboard-section {
          margin-bottom: 40px;
        }

        .dashboard-section h2 {
          margin-bottom: 20px;
          color: var(--text-color);
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .insight-card {
          border-left: 4px solid var(--primary-color);
        }

        .insight-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 10px;
        }

        .insight-header h3 {
          flex: 1;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .priority-high {
          background-color: #ffe0e0;
          color: #c92a2a;
        }

        .priority-medium {
          background-color: #fff3cd;
          color: #ff8787;
        }

        .priority-low {
          background-color: #e8f4f8;
          color: #0066cc;
        }

        .insight-text {
          margin-bottom: 12px;
          color: #555;
          line-height: 1.6;
        }

        .insight-recommendation {
          background-color: #f0f9ff;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: #0052a3;
        }

        .insight-impact {
          font-size: 0.85rem;
          color: #999;
        }

        .source-badge {
          font-weight: 600;
          padding: 8px 12px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../styles/theme';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import developerApi from './developerApi';
import { can, PERMISSIONS } from './developerPermissions';

export default function DeveloperDashboard({ user, token, onNavigate, onNotify }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await developerApi.getDashboardStats(token);
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to load platform statistics.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to developer telemetry backend.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  };

  const statNumberStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    marginTop: '4px',
    fontFamily: theme.typography.monoFontFamily,
  };

  const statLabelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Platform Operations & Telemetry
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Unified real-time system monitoring, tenant management, and API observability.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={fetchStats} loading={loading}>
            ↻ Refresh Metrics
          </Button>
          {can(user, PERMISSIONS.TENANTS_VIEW) && (
            <Button variant="primary" size="sm" onClick={() => onNavigate('tenants')}>
              Tenant Directory →
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px' }}>
          <strong>Error loading dashboard:</strong> {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {/* Total Tenants */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={statLabelStyle}>Total Tenants</span>
            <Badge variant="primary">Platform</Badge>
          </div>
          <div style={statNumberStyle}>{loading ? '...' : (stats?.tenants?.total ?? 0)}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#475569' }}>
            <span><strong>{stats?.tenants?.active ?? 0}</strong> active</span>
            <span>•</span>
            <span style={{ color: stats?.tenants?.suspended ? '#b45309' : '#475569' }}>
              <strong>{stats?.tenants?.suspended ?? 0}</strong> suspended
            </span>
          </div>
        </div>

        {/* Subscriptions */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={statLabelStyle}>Active Subscriptions</span>
            <Badge variant="success">Billing</Badge>
          </div>
          <div style={statNumberStyle}>{loading ? '...' : (stats?.subscriptions?.active ?? 0)}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#475569' }}>
            <span><strong>{stats?.subscriptions?.trialing ?? 0}</strong> trialing</span>
            <span>•</span>
            <span style={{ color: stats?.subscriptions?.expired ? '#b91c1c' : '#475569' }}>
              <strong>{stats?.subscriptions?.expired ?? 0}</strong> expired
            </span>
          </div>
        </div>

        {/* 24h Requests */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={statLabelStyle}>API Requests (24h)</span>
            <Badge variant="neutral">Traffic</Badge>
          </div>
          <div style={statNumberStyle}>{loading ? '...' : (stats?.telemetry_24h?.total_requests?.toLocaleString() ?? 0)}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#475569' }}>
            <span>Avg: <strong>{stats?.telemetry_24h?.avg_latency_ms ?? 0}ms</strong></span>
            <span>•</span>
            <span style={{ color: stats?.telemetry_24h?.slow_requests ? '#b45309' : '#475569' }}>
              <strong>{stats?.telemetry_24h?.slow_requests ?? 0}</strong> slow
            </span>
          </div>
        </div>

        {/* 24h Error Rate */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={statLabelStyle}>Failed Requests (24h)</span>
            <Badge variant={stats?.telemetry_24h?.errors > 0 ? 'danger' : 'success'}>
              {stats?.telemetry_24h?.errors > 0 ? 'Attention' : 'Healthy'}
            </Badge>
          </div>
          <div style={{ ...statNumberStyle, color: stats?.telemetry_24h?.errors > 0 ? '#dc2626' : '#059669' }}>
            {loading ? '...' : (stats?.telemetry_24h?.errors ?? 0)}
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            Status codes ≥ 400 captured with telemetry redaction.
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {can(user, PERMISSIONS.TENANTS_VIEW) && (
          <div
            style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => onNavigate('tenants')}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              🏢 Tenant Management
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
              View cross-tenant directories, inspect module entitlements, and execute administrative status changes.
            </p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>Open Tenant Directory →</span>
          </div>
        )}

        {can(user, PERMISSIONS.SUBSCRIPTIONS_VIEW) && (
          <div
            style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => onNavigate('subscriptions')}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              💳 Subscriptions & Plans
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
              Manage tenant trial durations, upgrade/downgrade subscription tiers, and review historical events.
            </p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>Manage Subscriptions →</span>
          </div>
        )}

        {can(user, PERMISSIONS.TELEMETRY_VIEW) && (
          <div
            style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => onNavigate('telemetry')}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              📡 Request Telemetry
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
              Search HTTP requests across endpoints, analyze server response latency, and inspect sanitized errors.
            </p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>Inspect Telemetry →</span>
          </div>
        )}

        {can(user, PERMISSIONS.ACTIVITY_VIEW) && (
          <div
            style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => onNavigate('activity')}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              🛡️ Audit Trail
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
              Review immutable append-only logs for administrative changes, role escalations, and security events.
            </p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>View Activity Logs →</span>
          </div>
        )}
      </div>

      {/* Two-column view: Recent Telemetry Errors & Recent Audit Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Recent Errors */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Telemetry Errors
            </h2>
            {can(user, PERMISSIONS.TELEMETRY_VIEW) && (
              <button
                onClick={() => onNavigate('telemetry')}
                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                View all
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ fontSize: '13px', color: '#64748b' }}>Loading recent error logs...</p>
          ) : !stats?.recent_errors?.length ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#10b981', fontSize: '13.5px' }}>
              ✓ No recent client or server errors reported.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recent_errors.map(err => (
                <div
                  key={err.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <Badge variant={err.status_code >= 500 ? 'danger' : 'warning'}>
                      {err.status_code}
                    </Badge>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{err.method}</span>
                    <span style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {err.endpoint}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>
                    {err.duration_ms}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Activities */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Administrative Audit Trail
            </h2>
            {can(user, PERMISSIONS.ACTIVITY_VIEW) && (
              <button
                onClick={() => onNavigate('activity')}
                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                View all
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ fontSize: '13px', color: '#64748b' }}>Loading audit events...</p>
          ) : !stats?.recent_activity?.length ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
              No recent administrative actions recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recent_activity.map(act => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    fontSize: '13px',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={act.severity === 'critical' ? 'danger' : act.severity === 'warning' ? 'warning' : 'neutral'}>
                        {act.severity}
                      </Badge>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{act.event}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ color: '#475569', fontSize: '12.5px' }}>
                    {act.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

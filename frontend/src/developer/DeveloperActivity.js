import React, { useState, useEffect, useCallback } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import developerApi from './developerApi';

export default function DeveloperActivity({ user, token, onNotify }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, total: 0, last_page: 1, per_page: 25 });

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      const res = await developerApi.getActivity(token, {
        search,
        severity: severityFilter,
        outcome: outcomeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        per_page: 25,
      });

      if (res.success) {
        setActivities(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        onNotify(res.message || 'Failed to fetch activity logs.', 'error');
      }
    } catch (err) {
      onNotify(err.message || 'Error communicating with activity API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, search, severityFilter, outcomeFilter, dateFrom, dateTo, page, onNotify]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical': return 'danger';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            System Activity & Audit Trail
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Immutable administrative logs, privilege changes, and security event recordings.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchActivity} loading={loading}>
          ↻ Refresh Logs
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
          <input
            type="text"
            placeholder="Search description, event, or correlation ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Severity Filter */}
        <div style={{ width: '130px' }}>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Outcome Filter */}
        <div style={{ width: '130px' }}>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
          >
            <option value="">All Outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        {(search || severityFilter || outcomeFilter || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSeverityFilter(''); setOutcomeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
            Reset Filters
          </Button>
        )}
      </div>

      {/* Activities Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Fetching audit logs...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '30px' }}>
            <EmptyState
              title="No audit events found"
              description="No activity log entries match your filter parameters."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px' }}>Severity</th>
                  <th style={{ padding: '12px 16px' }}>Event</th>
                  <th style={{ padding: '12px 16px' }}>Description</th>
                  <th style={{ padding: '12px 16px' }}>Outcome</th>
                  <th style={{ padding: '12px 16px' }}>Actor</th>
                  <th style={{ padding: '12px 16px' }}>Tenant</th>
                  <th style={{ padding: '12px 16px' }}>Time</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a, idx) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      fontSize: '13px',
                      color: '#334155',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Badge variant={getSeverityBadge(a.severity)}>{a.severity}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {a.event}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '300px' }}>
                      {a.description}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: a.outcome === 'success' ? '#16a34a' : '#dc2626',
                      }}>
                        {a.outcome === 'success' ? '✓ Success' : '✗ Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {a.actor?.name || 'System Scheduler'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {a.tenant?.name || (a.tenant_id ? `Tenant #${a.tenant_id}` : 'Platform')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedItem(a)}>
                        Properties
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.total > pagination.per_page && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
            <span>
              Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} audit events)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                ‹ Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pagination.last_page} onClick={() => setPage(p => p + 1)}>
                Next ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Details & Properties Modal */}
      {selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={`Audit Log Record: ${selectedItem.event}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header banner */}
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{selectedItem.description}</span>
                <Badge variant={getSeverityBadge(selectedItem.severity)}>{selectedItem.severity}</Badge>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Outcome: <strong style={{ color: selectedItem.outcome === 'success' ? '#16a34a' : '#dc2626' }}>{selectedItem.outcome}</strong> • Logged {new Date(selectedItem.created_at).toLocaleString()}
              </div>
            </div>

            {/* Properties JSON view */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Metadata & Properties Payload
              </div>
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: "'DM Mono', monospace",
                overflowX: 'auto',
                margin: 0,
                maxHeight: '260px',
              }}>
                {selectedItem.properties ? JSON.stringify(selectedItem.properties, null, 2) : '// No extended properties payload attached.'}
              </pre>
            </div>

            {/* Association Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Actor</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedItem.actor?.name || 'System'}</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Tenant</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedItem.tenant?.name || 'Platform-wide'}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
